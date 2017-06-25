'use strict';

class ServerError {
  constructor(message) {
    this.message = message;
  }
}

class InvalidRequestError {
  constructor(message) {
    this.message = message;
  }
}

class FakeServer {
  constructor(idGenerator, destination, time) {
    this.idGenerator = idGenerator;

    this.database = {};
    var writer = new SimpleWriter(this.database);
    var mappingWriter = new MappingWriter(writer);
    var teeWriter = new TeeWriter(
        mappingWriter,
        new CloningWriter(destination));
    var batchingWriter = new BatchingWriter(teeWriter);
    this.writer = batchingWriter;

    this.reader = new PathFindingReader(new SimpleReader(this.database));

    this.writer.set(this.reader.getGamePath(null), []);
    this.writer.set(this.reader.getUserPath(null), []);

    window.fakeServer = this;
  }
  getTime_(args) {
    let {requestTimeOffset} = args;
    if (!requestTimeOffset)
      requestTimeOffset = 0;
    return new Date().getTime() + requestTimeOffset;
  }
  register(args) {
    let {userId, name} = args;
    this.writer.insert(
        this.reader.getUserPath(null),
        null,
        new Model.User(userId, {
          name: name,
        }));
    return userId;
  }
  createGame(args) {
    let {gameId, adminUserId} = args;
    this.writer.insert(
        this.reader.getGamePath(null),
        null,
        new Model.Game(gameId, args));
    this.addAdmin({gameId: gameId, userId: adminUserId});
  }
  setAdminContact(args) {
    let {gameId, playerId} = args;
    this.writer.set(
        this.reader.getGamePath(gameId).concat(["adminContactPlayerId"]),
        playerId);
  }
  updateGame(args) {
    let {gameId} = args;
    for (let argName in args) {
      this.writer.set(
          this.reader.getGamePath(gameId).concat([argName]),
          args[argName]);
    }
  }
  addAdmin(args) {
    let {gameId, userId} = args;
    this.writer.insert(
        this.reader.getAdminPath(gameId, null),
        null,
        new Model.Admin(userId, {userId: userId}));
  }
  addDefaultProfileImage(args) {
    let {gameId, defaultProfileImageId} = args;
    this.writer.insert(
        this.reader.getDefaultProfileImagePath(gameId, null),
        null,
        new Model.DefaultProfileImage(defaultProfileImageId, args)
    );
  }
  createPlayer(args) {
    let {gameId, playerId, privatePlayerId, userId} = args;
    let publicPlayerId = playerId;
    let game = this.database.gamesById[gameId];

    if (!privatePlayerId)
      privatePlayerId = this.idGenerator.newPrivatePlayerId();

    let properties = Utils.copyOf(args);
    properties.allegiance = 'undeclared';
    properties.userId = userId;
    properties.canInfect = false;
    properties.points = 0;
    properties.number = 101 + game.players.length;

    let publicPlayer = new Model.PublicPlayer(publicPlayerId, properties);
    publicPlayer.private = new Model.PrivatePlayer(privatePlayerId, properties);

    this.writer.insert(this.reader.getPublicPlayerPath(gameId, null), null, publicPlayer);

    this.writer.insert(
        this.reader.getUserPublicPlayerPath(userId, null),
        null,
        new Model.UserPublicPlayer(publicPlayerId, {
            gameId: gameId,
            playerId: publicPlayerId
        }));
    this.updateMembershipsOnAllegianceChange(gameId, publicPlayerId);
  }
  createGroup(args) {
    let {gameId, groupId} = args;
    this.writer.insert(
        this.reader.getGroupPath(gameId, null),
        null,
        new Model.Group(groupId, args));
  }
  updateGroup(args) {
    throwError('Implement!');
  }
  setLastSeenChatTime(args) {
    throwError('Implement!');
  }
  createMap(args) {
    let {gameId, mapId} = args;
    this.writer.insert(
        this.reader.getMapPath(gameId, null),
        null,
        new Model.Map(mapId, args));
  }
  updateMap(args) {
    throwError('Implement!');
  }
  addMarker(args) {
    let {gameId, markerId, mapId} = args;
    this.writer.insert(
        this.reader.getMarkerPath(gameId, mapId, null),
        null,
        new Model.Marker(markerId, args));
  }
  createChatRoom(args) {
    let {gameId, chatRoomId, accessGroupId} = args;
    this.writer.insert(
        this.reader.getChatRoomPath(gameId, null),
        null,
        new Model.ChatRoom(chatRoomId, args));
    let group = this.database.gamesById[gameId].groupsById[accessGroupId];
    for (let {playerId} of group.memberships) {
      this.addPlayerToChatRoom_(gameId, chatRoomId, playerId);
    }
  }
  updateChatRoom(args) {
    throwError('Implement!');
  }
  updatePlayer(args) {
    let {gameId, playerId} = args;
    for (let argName in args) {
      if (Model.PUBLIC_PLAYER_PROPERTIES.includes(argName)) {
        this.writer.set(
            this.reader.getPublicPlayerPath(gameId, playerId).concat([argName]),
            args[argName]);
      }
    }
    for (let argName in args) {
      if (Model.PRIVATE_PLAYER_PROPERTIES.includes(argName)) {
        this.writer.set(
            this.reader.getPrivatePlayerPath(gameId, playerId).concat([argName]),
            args[argName]);
      }
    }
  }

  addPlayerToGroup(args) {
    let {gameId, groupId, playerToAddId} = args;
    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerToAddId];
    let group = game.groupsById[groupId];

    let existingMembership = group.membershipsByPlayerId[playerToAddId];
    if (existingMembership)
      return;

    if (group.allegianceFilter != 'none' && group.allegianceFilter != player.allegiance)
      throw InvalidRequestError('Player does not satisfy this group\'s allegiance filter!');

    this.writer.insert(
        this.reader.getMembershipPath(gameId, groupId, null),
        null,
        new Model.GroupMembership(playerToAddId, {playerId: playerToAddId}));
    this.writer.insert(
        this.reader.getPlayerGroupMembershipPath(gameId, playerToAddId, null),
        null,
        new Model.PlayerGroupMembership(groupId, {groupId: groupId}));

    for (let chatRoom of game.chatRooms) {
      if (chatRoom.accessGroupId == groupId) {
        this.addPlayerToChatRoom_(gameId, chatRoom.id, playerToAddId);
      }
    }
    for (let mission of game.missions) {
      if (mission.accessGroupId == groupId) {
        this.addPlayerToMission_(gameId, mission.id, playerToAddId);
      }
    }
  }

  removePlayerFromGroup(args) {
    let {gameId, groupId, playerToRemoveId} = args;
    let playerId = playerToRemoveId;
    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerId];
    let group = game.groupsById[groupId];

    let existingMembership = group.membershipsByPlayerId[playerId];
    if (!existingMembership)
      return;

    for (let chatRoom of game.chatRooms) {
      if (chatRoom.accessGroupId == groupId) {
        this.removePlayerFromChatRoom_(game.id, chatRoom.id, player.id);
      }
    }

    for (let mission of game.missions) {
      if (mission.accessGroupId == groupId) {
        this.removePlayerFromMission_(game.id, mission.id, player.id);
      }
    }

    let membershipPath = this.reader.getMembershipPath(gameId, groupId, playerId);
    this.writer.remove(
        membershipPath.slice(0, membershipPath.length - 1),
        membershipPath.slice(-1)[0], // index
        playerId);

    let playerGroupMembershipPath = this.reader.getPlayerGroupMembershipPath(gameId, playerId, groupId);
    this.writer.remove(
        playerGroupMembershipPath.slice(0, playerGroupMembershipPath.length - 1),
        playerGroupMembershipPath.slice(-1)[0],
        groupId);
  }

  addPlayerToChatRoom_(gameId, chatRoomId, playerId) {
    // Assumes already added to group
    this.writer.insert(
        this.reader.getPlayerChatRoomMembershipPath(gameId, playerId, null),
        null,
        new Model.PlayerChatRoomMembership(chatRoomId, {chatRoomId: chatRoomId, visible: true}));
  }

  addPlayerToMission_(gameId, missionId, playerId) {
    // Assumes already added to group
    this.writer.insert(
        this.reader.getPlayerMissionMembershipPath(gameId, playerId, null),
        null,
        new Model.PlayerMissionMembership(missionId, {missionId: missionId}));
  }

  removePlayerFromChatRoom_(gameId, chatRoomId, playerId) {
    // Assumes still in the group, and will be removed after this call
    let playerChatRoomMembershipPath = this.reader.getPlayerChatRoomMembershipPath(gameId, playerId, chatRoomId);
    this.writer.remove(
        playerChatRoomMembershipPath.slice(0, playerChatRoomMembershipPath.length - 1),
        playerChatRoomMembershipPath.slice(-1)[0],
        chatRoomId);
  }

  removePlayerFromMission_(gameId, missionId, playerId) {
    // Assumes still in the group, and will be removed after this call
    let playerMissionMembershipPath = this.reader.getPlayerMissionMembershipPath(gameId, playerId, missionId);
    this.writer.remove(
        playerMissionMembershipPath.slice(0, playerMissionMembershipPath.length - 1),
        playerMissionMembershipPath.slice(-1)[0],
        missionId);
  }

  sendChatMessage(args) {
    let {gameId, chatRoomId, playerId, messageId, message} = args;

    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerId];
    let chatRoom = game.chatRoomsById[chatRoomId];
    let group = game.groupsById[chatRoom.accessGroupId];
    if (group.membershipsByPlayerId[player.id]) {
      this.writer.insert(
          this.reader.getChatRoomPath(gameId, chatRoomId).concat(["messages"]),
          null,
          new Model.Message(messageId, Utils.merge(args, {
            time: this.getTime_(args),
            playerId: playerId,
          })));
    } else {
      throw InvalidRequestError('Can\'t send message to chat room without membership');
    }
  }

  updateChatRoomMembership(args) {
    let {gameId, chatRoomId, actingPlayerId} = args;
    let playerId = actingPlayerId;
    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerId];

    let playerChatRoomMembershipPath = this.reader.getPlayerChatRoomMembershipPath(gameId, playerId, chatRoomId);

    for (let argName in args) {
      this.writer.set(
          playerChatRoomMembershipPath.concat([argName]),
          args[argName]);
    }
  }

  addRequestCategory(args) {
    let {gameId, requestCategoryId, chatRoomId} = args;
    this.writer.insert(
        this.reader.getRequestCategoryPath(gameId, chatRoomId, null),
        null,
        new Model.RequestCategory(requestCategoryId, Utils.merge(args, {
          time: this.getTime_(args),
        })));
  }

  updateRequestCategory(args) {
    let {gameId, requestCategoryId} = args;
    let chatRoomId = this.reader.getChatRoomIdForRequestCategoryId(requestCategoryId);
    let requestCategoryPath = this.reader.getRequestCategoryPath(gameId, chatRoomId, requestCategoryId);
    for (let argName in args) {
      this.writer.set(requestCategoryPath.concat([argName]), args[argName]);
    }
  }
  
  addRequest(args) {
    let {gameId, requestId, requestCategoryId, playerId} = args;
    let chatRoomId = this.reader.getChatRoomIdForRequestCategoryId(requestCategoryId);
    this.writer.insert(
        this.reader.getRequestPath(gameId, chatRoomId, requestCategoryId, null),
        null,
        new Model.Request(requestId, {
          playerId: playerId,
          time: null,
          text: null,
        }));
  }

  addResponse(args) {
    let {gameId, requestId, text} = args;
    let requestCategoryId = this.reader.getRequestCategoryIdForRequestId(requestId);
    let chatRoomId = this.reader.getChatRoomIdForMessageId(requestId);
    let requestCategory = this.reader.get(this.reader.getRequestCategoryPath(gameId, chatRoomId, requestCategoryId));
    let requestPath = this.reader.getRequestPath(gameId, chatRoomId, requestCategoryId, requestId);
    let request = this.reader.get(requestPath);
    if (requestCategory.type == 'ack')
      assert(text === null);
    else if (requestCategory.type == 'text')
      assert(typeof text == 'string' && text);
    else
      throwError('Bad request type');
    this.writer.set(requestPath.concat(["response"]), {
      time: this.getTime_(args),
      text: text
    });
  }

  addMission(args) {
    let {gameId, missionId, accessGroupId} = args;
    this.writer.insert(
        this.reader.getMissionPath(gameId, null),
        null,
        new Model.Mission(missionId, args));
    this.addMissionMembershipsForAllGroupMembers_(gameId, missionId, accessGroupId);
  }

  addMissionMembershipsForAllGroupMembers_(gameId, missionId, accessGroupId) {
    let group = this.database.gamesById[gameId].groupsById[accessGroupId];
    for (let {playerId} of group.memberships) {
      this.addPlayerToMission_(gameId, missionId, playerId);
    }
  }

  removeMissionMembershipsForAllGroupMembers_(gameId, missionId, accessGroupId) {
    let group = this.database.gamesById[gameId].groupsById[accessGroupId];
    for (let {playerId} of group.memberships) {
      this.removePlayerFromMission_(gameId, missionId, playerId);
    }
  }

  updateMission(args) {
    let {gameId, missionId} = args;
    let missionPath = this.reader.getMissionPath(gameId, missionId);
    let mission = this.database.gamesById[gameId].missionsById[missionId];
    if ('accessGroupId' in args) {
      this.removeMissionMembershipsForAllGroupMembers_(gameId, missionId, mission.accessGroupId);
      this.addMissionMembershipsForAllGroupMembers_(gameId, missionId, args.accessGroupId);
    }
    for (let argName in args) {
      this.writer.set(missionPath.concat([argName]), args[argName]);
    }
  }
  deleteMission(args) {
    let {gameId, missionId} = args;
    let missionPath = this.reader.getMissionPath(gameId, missionId);
    this.writer.remove(
        missionPath.slice(0, missionPath.length - 1),
        missionPath.slice(-1)[0], // index
        missionId);
  }
  addRewardCategory(args) {
    let {rewardCategoryId, gameId} = args;
    this.writer.insert(
        this.reader.getRewardCategoryPath(gameId, null),
        null,
        new Model.RewardCategory(rewardCategoryId, args));
  }
  updateRewardCategory(args) {
    let {gameId, rewardCategoryId} = args;
    let rewardCategoryPath = this.reader.getRewardCategoryPath(gameId, rewardCategoryId);
    for (let argName in args) {
      this.writer.set(rewardCategoryPath.concat([argName]), args[argName]);
    }
  }
  updateNotification(args) {
    this.updateQueuedNotification(args);
  }
  sendNotification(args) {
    this.addQueuedNotification(args);
    let millisecondsUntilSend = args.sendTime - this.getTime_(args);
    if (millisecondsUntilSend > 0) {
      setTimeout(
          () => this.executeNotifications(args),
          millisecondsUntilSend);
    } else {
      this.executeNotifications(args);
    }
  }
  executeNotifications(args) {
    for (let game of this.database.games) {
      for (let queuedNotification of game.queuedNotifications) {
        if (!queuedNotification.sent && (queuedNotification.sendTime == null || queuedNotification.sendTime <= this.getTime_(args))) {
          this.writer.set(this.reader.getQueuedNotificationPath(game.id, queuedNotification.id).concat(['sent']), true);

          let playerIds = new Set();
          if (queuedNotification.playerId) {
            playerIds.add(queuedNotification.playerId);
          } else {
            assert(queuedNotification.groupId);
            let group = game.groupsById[queuedNotification.groupId];
            playerIds = new Set(group.memberships.map(membership => membership.playerId));
          }
          for (let playerId of playerIds) {
            this.addNotification({
              gameId: args.gameId,
              playerId: playerId,
              notificationId: this.idGenerator.newNotificationId(),
              queuedNotificationId: queuedNotification.id,
              message: queuedNotification.message,
              previewMessage: queuedNotification.previewMessage,
              destination: queuedNotification.destination,
              time: this.getTime_(args),
              icon: queuedNotification.icon,
            });
          }
        }
      }
    }
  }
  addQueuedNotification(args) {
    let {gameId, queuedNotificationId} = args;
    args.sent = false;
    this.writer.insert(
        this.reader.getQueuedNotificationPath(gameId, null),
        null,
        new Model.QueuedNotification(queuedNotificationId, args));
  }
  addNotification(args) {
    let {gameId, queuedNotificationId, notificationId, playerId} = args;
    let properties = Utils.copyOf(args);
    properties.seenTime = null;
    properties.queuedNotificationId = queuedNotificationId;
    properties.time = this.getTime_(args);
    this.writer.insert(
        this.reader.getNotificationPath(gameId, playerId, null),
        null,
        new Model.Notification(notificationId, properties));
  }
  updateQueuedNotification(args) {
    let {gameId, queuedNotificationId} = args;
    let queuedNotificationPath = this.reader.getQueuedNotificationPath(gameId, queuedNotificationId);
    for (let argName in args) {
      this.writer.set(queuedNotificationPath.concat([argName]), args[argName]);
    }
  }
  markNotificationSeen(args) {
    let {gameId, notificationId} = args;
    let playerId = this.reader.getPlayerIdForNotificationId(notificationId);
    this.writer.set(
        this.reader.getNotificationPath(gameId, playerId, notificationId).concat(["seenTime"]),
        this.getTime_(args));
  }
  addReward(args) {
    let {gameId, rewardCategoryId, rewardId, code} = args;
    let rewardCategory = this.database.gamesById[gameId].rewardCategoriesById[rewardCategoryId];
    code = code || rewardCategory.shortName + ' ' + rewardCategory.rewards.length;
    this.writer.insert(
        this.reader.getRewardPath(gameId, rewardCategoryId, null),
        null,
        new Model.Reward(rewardId, Utils.merge(args, {
          code: code,
          rewardCategoryId: rewardCategoryId,
          playerId: null,
        })));
  }
  addRewards(args) {
    let {gameId, rewardCategoryId, count} = args;
    let rewardCategory = this.database.gamesById[gameId].rewardCategoriesById[rewardCategoryId];
    for (let i = 0; i < count; i++) {
      let rewardId = this.idGenerator.newRewardId();
      let code = rewardCategory.shortName + ' ' + rewardCategory.rewards.length;
      this.addReward({
        id: rewardId,
        gameId: gameId,
        rewardId: rewardId,
        rewardCategoryId: rewardCategoryId,
        code: code
      });
    }
  }
  addGun(args) {
    let {gunId, gameId, label} = args;
    let properties = {
      id: gunId,
      label: label,
      playerId: null,
    };
    this.writer.insert(
        this.reader.getGunPath(gameId, null),
        null,
        properties);
  }
  updateGun(args) {
    let {gameId, gunId} = args;
    for (let argName in args) {
      this.writer.set(
          this.reader.getGunPath(gameId, gunId).concat([argName]),
          args[argName]);
    }
  }
  assignGun(args) {
    let {gameId, gunId, playerId} = args;
    let gunPath = this.reader.getGunPath(gameId, gunId);
    this.writer.set(gunPath.concat(["playerId"]), playerId);
  }
  claimReward({gameId, playerId, rewardCode}) {
    assert(typeof rewardCode == 'string');
    rewardCode = rewardCode.replace(/\s/g, '').toLowerCase();
    // let playerPath = this.reader.pathForId(playerId);
    // let gamePath = playerPath.slice(0, 2);
    // let gameId = this.reader.getGameIdForPlayerId(playerId);
    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerId];

    // let rewardCategoriesPath = gamePath.concat(["rewardCategories"]);
    for (let i = 0; i < game.rewardCategories.length; i++) {
      let rewardCategory = game.rewardCategories[i];
      for (let j = 0; j < rewardCategory.rewards.length; j++) {
        let reward = rewardCategory.rewards[j];
        if (reward.code.replace(/\s/g, '').toLowerCase() == rewardCode) {
          this.writer.set(
              this.reader.getRewardPath(gameId, rewardCategory.id, reward.id).concat(["playerId"]),
              playerId);
          this.writer.set(
              this.reader.getPublicPlayerPath(gameId, player.id).concat(["points"]),
              player.points + rewardCategory.points);
          this.writer.insert(
              this.reader.getClaimPath(gameId, playerId, null),
              null,
              new Model.Claim(this.idGenerator.newClaimId(), {
                rewardCategoryId: rewardCategory.id,
                rewardId: reward.id,
              }));
          return rewardCategory.id;
        }
      }
    }
    assert(false);
  }
  selfInfect(args) {
    let {playerId} = args;
    this.setPlayerZombie(gameId, playerId);
  }
  joinResistance(args) {
    let {gameId, playerId, lifeId, privateLifeId, lifeCode} = args;
    let publicLifeId = lifeId;

    let player = this.reader.get(this.reader.getPublicPlayerPath(gameId, playerId));
    assert(player.allegiance == 'undeclared');

    this.addLife(args);
    this.setPlayerHuman(gameId, playerId);
  }
  joinHorde(args) {
    let {gameId, playerId} = args;
    this.setPlayerZombie(gameId, playerId);
  }
  // autoRemovePlayerFromGroups_(playerId) {
  //   let gameId = this.reader.getGameIdForPlayerId(playerId);
  //   let game = this.database.gamesById[gameId];
  //   let player = game.playersById[playerId];
  //   for (let group of this.database.gamesById[gameId].groups) {
  //     if (group.autoRemove) {
  //       if (group.allegianceFilter && group.allegianceFilter != player.allegiance) {
  //         this.removePlayerFromGroup({groupId: group.id, playerToAddId: playerId});
  //       }
  //     }
  //   }
  // }
  // autoAddPlayerToGroups_(playerId) {
  //   let gameId = this.reader.getGameIdForPlayerId(playerId);
  //   let game = this.database.gamesById[gameId];
  //   let player = game.playersById[playerId];
  //   for (let group of this.database.gamesById[gameId].groups) {
  //     if (group.autoAdd) {
  //       console.log('considering', group.name, group.autoAdd, group.allegianceFilter, player.name, player.allegianceFilter);
  //       if (group.allegianceFilter == 'none' || group.allegianceFilter == player.allegiance) {
  //         this.addPlayerToGroup({groupId: group.id, playerToAddId: playerId});
  //       }
  //     }
  //   }
  // }
  updateMembershipsOnAllegianceChange(gameId, playerId) {
    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerId];

    for (let group of this.database.gamesById[gameId].groups) {
      if (group.autoRemove) {
        if (group.allegianceFilter != 'none' && group.allegianceFilter != player.allegiance) {
          if (group.memberships.find(m => m.playerId == playerId)) {
            this.removePlayerFromGroup({gameId, gameId, groupId: group.id, playerToRemoveId: playerId});
          }
        }
      }
    }
    for (let group of this.database.gamesById[gameId].groups) {
      if (group.autoAdd) {
        if (group.allegianceFilter == 'none' || group.allegianceFilter == player.allegiance) {
          this.addPlayerToGroup({gameId: gameId, groupId: group.id, playerToAddId: playerId});
        }
      }
    }
  }
  setPlayerZombie(gameId, playerId) {
    let publicPlayerPath = this.reader.getPublicPlayerPath(gameId, playerId);
    this.writer.set(publicPlayerPath.concat(["allegiance"]), "horde");
    let privatePlayerPath = this.reader.getPrivatePlayerPath(gameId, playerId);
    this.writer.set(privatePlayerPath.concat(["canInfect"]), true);
    this.updateMembershipsOnAllegianceChange(gameId, playerId);
  }
  setPlayerHuman(gameId, playerId) {
    let publicPlayerPath = this.reader.getPublicPlayerPath(gameId, playerId);
    this.writer.set(publicPlayerPath.concat(["allegiance"]), "resistance");
    let privatePlayerPath = this.reader.getPrivatePlayerPath(gameId, playerId);
    this.writer.set(privatePlayerPath.concat(["canInfect"]), false);
    this.updateMembershipsOnAllegianceChange(gameId, playerId);
  }
  findPlayerByIdOrLifeCode_(gameId, playerId, lifeCode) {
    let players = this.reader.get(this.reader.getPublicPlayerPath(gameId, null));
    assert(playerId || lifeCode);
    if (playerId) {
      let player = this.reader.get(this.reader.getPublicPlayerPath(gameId, playerId));
      if (!player) {
        throw InvalidRequestError('No player found with id ' + playerId);
      }
      return player;
    } else {
      for (let i = 0; i < players.length; i++) {
        let player = players[i];
        if (player.lives.length) {
          let life = player.lives[player.lives.length - 1];
          if (life.private.code == lifeCode) {
            return player;
          }
        }
      }
      throw new InvalidRequestError('No player found with life code ' + lifeCode);
    }
  }
  infect(request) {
    let {infectionId, infectorPlayerId, victimLifeCode, victimPlayerId, gameId} = request;
    let victimPlayer = this.findPlayerByIdOrLifeCode_(gameId, victimPlayerId, victimLifeCode);
    victimPlayerId = victimPlayer.id;
    let infectorPlayerPath = this.reader.getPublicPlayerPath(gameId, infectorPlayerId);
    let infectorPlayer = this.reader.get(infectorPlayerPath);
    this.writer.set(
        infectorPlayerPath.concat(["points"]),
        this.reader.get(infectorPlayerPath.concat(["points"])) + 100);
    let victimPrivatePlayerPath = this.reader.getPrivatePlayerPath(gameId, victimPlayer.id);
    if (infectorPlayer.allegiance == 'resistance') {
      // Add a self-infection
      this.addInfection_(request, gameId, this.idGenerator.newInfectionId(), infectorPlayerId, infectorPlayerId);
      // Set the infector to zombie
      // Oddity: if the possessed human has some extra lives, they just become regular human. weird!
      if (infectorPlayer.infections.length >= infectorPlayer.lives.length) {
        this.setPlayerZombie(gameId, infectorPlayer.id);
      }
      // The victim can now infect
      this.writer.set(victimPrivatePlayerPath.concat(["canInfect"]), true);
    } else {
      // Add an infection to the victim
      this.addInfection_(request, gameId, this.idGenerator.newInfectionId(), victimPlayerId, infectorPlayerId);
      // Set the victim to zombie
      if (victimPlayer.infections.length >= victimPlayer.lives.length) {
        this.setPlayerZombie(gameId, victimPlayer.id);
      }
    }
    return victimPlayer.id;
  }

  addInfection_(request, gameId, infectionId, infecteePlayerId, infectorPlayerId) {
    let infecteePlayerPath = this.reader.getPublicPlayerPath(gameId, infecteePlayerId);
    let infecteePlayer = this.reader.get(infecteePlayerPath);
    let time = this.getTime_(request);

    let latestTime = 0;
    assert(infecteePlayer.lives);
    assert(infecteePlayer.infections);
    for (let life of infecteePlayer.lives)
      latestTime = Math.max(latestTime, life.time);
    for (let infection of infecteePlayer.infections)
      latestTime = Math.max(latestTime, infection.time);
    assert(time > latestTime);

    this.writer.insert(
        infecteePlayerPath.concat(["infections"]),
        null,
        new Model.Infection(infectionId, {
          infectorId: infectorPlayerId,
          time: time,
        }));
  }

  addLife(request) {
    let {gameId, lifeId, privateLifeId, playerId, lifeCode} = request;
    let publicLifeId = lifeId;
    let code = lifeCode || "codefor-" + publicLifeId;
    let playerPath = this.reader.getPublicPlayerPath(gameId, playerId);
    let player = this.reader.get(playerPath);
    let time = this.getTime_(request);

    let latestTime = 0;
    assert(player.lives);
    assert(player.infections);
    for (let life of player.lives)
      latestTime = Math.max(latestTime, life.time);
    for (let infection of player.infections)
      latestTime = Math.max(latestTime, infection.time);
    assert(time > latestTime);

    publicLifeId = publicLifeId || this.idGenerator.newPublicLifeId();
    privateLifeId = privateLifeId || this.idGenerator.newPrivateLifeId();

    assert(player.lives.length == player.infections.length);
    this.writer.insert(
        this.reader.getPublicLifePath(gameId, playerId, null),
        null,
        new Model.PublicLife(publicLifeId, {
          privateLifeId: privateLifeId,
          time: this.getTime_(request),
          private:
              new Model.PrivateLife(privateLifeId, {
                code: lifeCode
              }),
        }));
    if (player.lives.length > player.infections.length) {
      this.setPlayerHuman(gameId, playerId);
    }
  }

  updateQuizQuestion(args) {
    throwError('Implement!');
  }
  updateQuizAnswer(args) {
    throwError('Implement!');
  }
  addQuizQuestion(args) {
    let {gameId, quizQuestionId} = args;
    this.writer.insert(
        this.reader.getQuizQuestionPath(gameId, null),
        null,
        new Model.QuizQuestion(quizQuestionId, args));
  }
  addQuizAnswer(args) {
    let {gameId, quizAnswerId, quizQuestionId} = args;
    this.writer.insert(
        this.reader.getQuizAnswerPath(gameId, quizQuestionId, null),
        null,
        new Model.QuizAnswer(quizAnswerId, args));
  }
}
