'use strict';

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
    let {serverTime} = args;
    return serverTime || new Date().getTime();
  }
  register(args) {
    let {userId, name} = args;
    this.writer.insert(this.reader.getUserPath(null), null, {
      id: userId,
      name: name,
      players: [],
    });
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
    let {gameId, playerId, userId} = args;
    let game = this.database.gamesById[gameId];
    this.writer.insert(
        this.reader.getPlayerPath(gameId, null),
        null,
        new Model.Player(playerId, Utils.merge(args, {
            allegiance: 'undeclared',
            userId: userId,
            canInfect: false,
            points: 0,
            number: game.players.length
        })));
    this.writer.insert(
        this.reader.getUserPlayerPath(userId, null),
        null,
        new Model.UserPlayer(playerId, {
            gameId: gameId,
            playerId: playerId
        }));
    this.updateMembershipsOnAllegianceChange(playerId);
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
    let {markerId, mapId} = args;
    let gameId = this.reader.getGameIdForMapId(mapId);
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
    let {playerId} = args;
    let gameId = this.reader.getGameIdForPlayerId(playerId);
    for (let argName in args) {
      this.writer.set(
          this.reader.getPlayerPath(gameId, playerId).concat([argName]),
          args[argName]);
    }
  }

  addPlayerToGroup(args) {
    let {groupId, playerToAddId} = args;
    let gameId = this.reader.getGameIdForGroupId(groupId);
    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerToAddId];
    let group = game.groupsById[groupId];

    let existingMembership = group.membershipsByPlayerId[playerToAddId];
    if (existingMembership)
      return;

    if (group.allegianceFilter != 'none' && group.allegianceFilter != player.allegiance)
      throw 'Player does not satisfy this group\'s allegiance filter!';

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
    let {groupId, playerToAddId} = args;
    let playerId = playerToAddId;
    let gameId = this.reader.getGameIdForGroupId(groupId);
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
        new Model.PlayerChatRoomMembership(chatRoomId, {chatRoomId: chatRoomId}));
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
    let {chatRoomId, playerId, messageId} = args;

    let gameId = this.reader.getGameIdForChatRoomId(chatRoomId);
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
      throw 'Can\'t send message to chat room without membership';
    }
  }

  addRequestCategory(args) {
    let {requestCategoryId, chatRoomId} = args;
    let gameId = this.reader.getGameIdForChatRoomId(chatRoomId);
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
    let {requestId, requestCategoryId, playerId} = args;
    let chatRoomId = this.reader.getChatRoomIdForRequestCategoryId(requestCategoryId);
    let gameId = this.reader.getGameIdForChatRoomId(chatRoomId);
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
    let {requestId, responseId, text} = args;
    let requestCategoryId = this.reader.getRequestCategoryIdForRequestId(requestId);
    let chatRoomId = this.reader.getChatRoomIdForMessageId(requestId);
    let gameId = this.reader.getGameIdForChatRoomId(chatRoomId);
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
    let group = this.database.gamesById[gameId].groupsById[accessGroupId];
    for (let {playerId} of group.memberships) {
      this.addPlayerToMission_(gameId, missionId, playerId);
    }
  }
  updateMission(args) {
    let missionPath = this.reader.pathForId(missionId);
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
    this.updateNotificationCategory(args);
  }
  sendNotification(args) {
    this.addNotificationCategory(args);
  }
  addNotificationCategory(args) {
    let {gameId, notificationCategoryId} = args;
    this.writer.insert(
        this.reader.getNotificationCategoryPath(gameId, null),
        null,
        new Model.NotificationCategory(notificationCategoryId, args));
  }
  addNotification(args) {
    let {notificationCategoryId, notificationId, playerId} = args;
    let properties = Utils.copyOf(args);
    properties.seenTime = null;
    properties.notificationCategoryId = notificationCategoryId;
    let gameId = this.reader.getGameIdForPlayerId(playerId);
    this.writer.insert(
        this.reader.getNotificationPath(gameId, playerId, null),
        null,
        new Model.Notification(notificationId, properties));
  }
  updateNotificationCategory(args) {
    let notificationCategoryPath = this.reader.pathForId(notificationCategoryId);
    for (let argName in args) {
      this.writer.set(notificationCategoryPath.concat([argName]), args[argName]);
    }
  }
  markNotificationSeen(args) {
    let {notificationId} = args;
    let [gameId, playerId] = this.reader.getGameIdAndPlayerIdForNotificationId(notificationId);
    this.writer.set(
        this.reader.getNotificationPath(gameId, playerId, notificationId).concat(["seenTime"]),
        this.getTime_(args));
  }
  addReward(args) {
    let {rewardCategoryId, rewardId, code} = args;
    let gameId = this.reader.getGameIdForRewardCategoryId(rewardCategoryId);
    this.writer.insert(
        this.reader.getRewardPath(gameId, rewardCategoryId, null),
        null,
        new Model.Reward(rewardId, Utils.merge(args, {
          code: code || "" + Math.random(),
          rewardCategoryId: rewardCategoryId,
          playerId: null,
        })));
  }
  addRewards(rewardCategoryId, numToAdd) {
    for (let i = 0; i < numToAdd; i++) {
      let rewardId = this.idGenerator.newRewardId();
      let code = Math.random() * Math.pow(2, 52);
      this.addReward({id: rewardId, rewardCategoryId: rewardCategoryId, code: code});
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
              this.reader.getPlayerPath(gameId, player.id).concat(["points"]),
              player.points + rewardCategory.points);
          this.writer.insert(
              this.reader.getClaimPath(gameId, playerId, null),
              null,
              new Model.Claim(this.idGenerator.newClaimId(), {
                rewardCategoryId: rewardCategory.id,
                rewardId: reward.id,
              }));
          return;
        }
      }
    }
    assert(false);
  }
  selfInfect(args) {
    let {playerId} = args;
    this.setPlayerZombie(playerId);
  }
  joinResistance(args) {
    let {playerId, lifeCode} = args;

    let gameId = this.reader.getGameIdForPlayerId(playerId);
    let player = this.reader.get(this.reader.getPlayerPath(gameId, playerId));
    assert(player.allegiance == 'undeclared');

    this.addLife({
      lifeId: this.idGenerator.newLifeId(),
      playerId: playerId,
      lifeCode: lifeCode
    });
    this.setPlayerHuman(playerId);
  }
  joinHorde(args) {
    let {playerId} = args;
    this.setPlayerZombie(playerId);
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
  updateMembershipsOnAllegianceChange(playerId) {
    let gameId = this.reader.getGameIdForPlayerId(playerId);
    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerId];

    for (let group of this.database.gamesById[gameId].groups) {
      if (group.autoRemove) {
        if (group.allegianceFilter != 'none' && group.allegianceFilter != player.allegiance) {
          if (group.memberships.find(m => m.playerId == playerId)) {
            this.removePlayerFromGroup({groupId: group.id, playerToAddId: playerId});
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
  setPlayerZombie(playerId) {
    let gameId = this.reader.getGameIdForPlayerId(playerId);
    let playerPath = this.reader.getPlayerPath(gameId, playerId);
    this.writer.set(playerPath.concat(["canInfect"]), true);
    this.writer.set(playerPath.concat(["allegiance"]), "horde");
    this.updateMembershipsOnAllegianceChange(playerId);
  }
  setPlayerHuman(playerId) {
    let gameId = this.reader.getGameIdForPlayerId(playerId);
    let playerPath = this.reader.getPlayerPath(gameId, playerId);
    this.writer.set(playerPath.concat(["canInfect"]), false);
    this.writer.set(playerPath.concat(["allegiance"]), "resistance");
    this.updateMembershipsOnAllegianceChange(playerId);
  }
  findPlayerByIdOrLifeCode_(gameId, playerId, lifeCode) {
    let players = this.reader.get(this.reader.getPlayerPath(gameId, null));
    assert(playerId || lifeCode);
    if (playerId) {
      let player = this.reader.get(this.reader.getPlayerPath(gameId, playerId));
      if (!player) {
        throw 'No player found with id ' + playerId;
      }
      return player;
    } else {
      for (let i = 0; i < players.length; i++) {
        let player = players[i];
        if (player.lives.length) {
          let life = player.lives[player.lives.length - 1];
          if (life.code == lifeCode) {
            return player;
          }
        }
      }
      throw 'No player found with life code ' + lifeCode;
    }
  }
  infect(args) {
    let {infectionId, infectorPlayerId, victimLifeCode, victimPlayerId, gameId} = args;
    let victimPlayer = this.findPlayerByIdOrLifeCode_(gameId, victimPlayerId, victimLifeCode);
    let infectorPlayerPath = this.reader.getPlayerPath(gameId, infectorPlayerId);
    this.writer.set(
        this.reader.getPlayerPath(gameId, infectorPlayerId).concat(["points"]),
        this.reader.get(infectorPlayerPath.concat(["points"])) + 100);
    let victimPlayerPath = this.reader.getPlayerPath(gameId, victimPlayer.id);
    this.writer.insert(
        victimPlayerPath.concat(["infections"]),
        null,
        new Model.Infection(this.idGenerator.newInfectionId(), {
          infectorId: infectorPlayerId,
          time: this.getTime_(args),
        }));
    victimPlayer = this.reader.get(victimPlayerPath);
    if (victimPlayer.infections.length >= victimPlayer.lives.length) {
      this.setPlayerZombie(victimPlayer.id);
    }
    return victimPlayer.id;
  }
  addLife(args) {
    let {lifeId, playerId, lifeCode} = args;
    let code = lifeCode || "codefor-" + lifeId;
    let gameId = this.reader.getGameIdForPlayerId(playerId);
    let playerPath = this.reader.getPlayerPath(gameId, playerId);
    this.writer.insert(
        this.reader.getLifePath(gameId, playerId, null),
        null,
        new Model.Life(lifeId, {
          code: code,
          time: this.getTime_(args),
        }));
    let player = this.reader.get(playerPath);
    if (player.lives.length > player.infections.length) {
      this.setPlayerHuman(playerId);
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
    let {quizAnswerId, quizQuestionId} = args;
    let gameId = this.reader.getGameIdForQuizQuestionId(quizQuestionId);
    this.writer.insert(
        this.reader.getQuizAnswerPath(gameId, quizQuestionId, null),
        null,
        new Model.QuizAnswer(quizAnswerId, args));
  }
}
