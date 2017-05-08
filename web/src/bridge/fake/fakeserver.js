'use strict';

class FakeServer {
  constructor(destination, time) {
    this.database = {};
    var writer = new SimpleWriter(this.database);
    var mappingWriter = new MappingWriter(writer);
    var teeWriter = new TeeWriter(mappingWriter, new CloningWriter(destination), true);
    this.writer = teeWriter;

    this.reader = new PathFindingReader(new SimpleReader(this.database));

    this.time = time;

    this.writer.set(this.reader.getGunPath(null), []);
    this.writer.set(this.reader.getGamePath(null), []);
    this.writer.set(this.reader.getUserPath(null), []);

    window.fakeServer = this;
  }
  setTime(time) {
    this.time = time;
  }
  signIn(preferredUserId) {
    assert(preferredUserId);
    return preferredUserId;
  }
  register(args) {
    let {userId, name} = args;
    this.writer.insert(this.reader.getUserPath(null), null, {
      id: userId,
      name: name,
      players: [],
    });
  }
  createGame(args) {
    let {gameId, firstAdminUserId} = args;
    this.writer.insert(
        this.reader.getGamePath(null),
        null,
        newGame(gameId, args));
    this.addAdmin({gameId: gameId, userId: firstAdminUserId});
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
        newAdmin(userId, {userId: userId}));
  }
  createPlayer(args) {
    let {gameId, playerId, userId} = args;
    let game = this.database.gamesById[gameId];
    this.writer.insert(
        this.reader.getPlayerPath(gameId, null),
        null,
        newPlayer(playerId, Utils.merge(args, {
            allegiance: '',
            userId: userId,
            canInfect: false,
            points: 0,
            number: game.players.length
        })));
    this.writer.insert(
        this.reader.getUserPlayerPath(userId, null),
        null,
        newUserPlayer(playerId, {
            gameId: gameId,
            playerId: playerId
        }));
  }
  createGroup(args) {
    let {ownerPlayerId, gameId, groupId, playerId} = args;
    this.writer.insert(
        this.reader.getGroupPath(gameId, null),
        null,
        newGroup(groupId, args));
  }
  updateGroup(args) {
    throwError('Implement!');
  }
  setLastSeenChatTime(args) {
    throwError('Implement!');
  }
  createChatRoom(args) {
    let {groupId, chatRoomId} = args;
    let gameId = this.reader.getGameIdForGroupId(groupId);
    this.writer.insert(
        this.reader.getChatRoomPath(gameId, null),
        null,
        newChatRoom(chatRoomId, Utils.merge(args, {
          groupId: groupId,
        })));
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

    if (group.allegianceFilter && group.allegianceFilter != player.allegiance)
      throw 'Player does not satisfy this group\'s allegiance filter!';

    this.writer.insert(
        this.reader.getMembershipPath(gameId, groupId, null),
        null,
        newGroupMembership(playerToAddId, {playerId: playerToAddId}));
    this.writer.insert(
        this.reader.getPlayerGroupMembershipPath(gameId, playerToAddId, null),
        null,
        newPlayerGroupMembership(groupId, {groupId: groupId}));

    for (let chatRoom of game.chatRooms) {
      if (chatRoom.groupId == groupId) {
        this.addPlayerToChatRoom_(gameId, groupId, chatRoom.id, playerToAddId);
      }
    }
  }

  removePlayerFromGroup(args) {
    let {groupId, playerToRemoveId} = args;
    let playerId = playerToRemoveId;
    let gameId = this.reader.getGameIdForGroupId(groupId);
    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerId];
    let group = game.groupsById[groupId];

    let existingMembership = group.membershipsByPlayerId[playerId];
    if (!existingMembership)
      return;

    for (let chatRoom of game.chatRooms) {
      if (chatRoom.groupId == groupId) {
        this.removePlayerFromChatRoom_(game.id, group.id, chatRoom.id, player.id);
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

  addPlayerToChatRoom_(gameId, groupId, chatRoomId, playerId) {
    // Assumes already added to group
    this.writer.insert(
        this.reader.getPlayerChatRoomMembershipPath(gameId, playerId, null),
        null,
        newPlayerChatRoomMembership(chatRoomId, {chatRoomId: chatRoomId}));
  }

  removePlayerFromChatRoom_(gameId, groupId, chatRoomId, playerId) {
    // Assumes still in the group, and will be removed after this call
    let playerChatRoomMembershipPath = this.reader.getPlayerChatRoomMembershipPath(gameId, playerId, chatRoomId);
    this.writer.remove(
        playerChatRoomMembershipPath.slice(0, playerChatRoomMembershipPath.length - 1),
        playerChatRoomMembershipPath.slice(-1)[0],
        chatRoomId);
  }

  sendChatMessage(args) {
    let {chatRoomId, playerId, messageId, message} = args;

    let gameId = this.reader.getGameIdForChatRoomId(chatRoomId);
    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerId];
    let chatRoom = game.chatRoomsById[chatRoomId];
    let group = game.groupsById[chatRoom.groupId];
    if (group.membershipsByPlayerId[player.id]) {
      this.writer.insert(
          this.reader.getChatRoomPath(gameId, chatRoomId).concat(["messages"]),
          null,
          newMessage(messageId, Utils.merge(args, {
            time: this.time,
            playerId: playerId,
          })));
    } else {
      throw 'Can\'t send message to chat room without membership';
    }
  }
  addMission(args) {
    let {gameId, missionId} = args;
    this.writer.insert(
        this.reader.getMissionPath(gameId, null),
        null,
        newMission(missionId, args));
  }
  updateMission(args) {
    let missionPath = this.reader.pathForId(missionId);
    for (let argName in args) {
      this.writer.set(missionPath.concat([argName]), args[argName]);
    }
  }
  addRewardCategory(args) {
    let {rewardCategoryId, gameId} = args;
    this.writer.insert(
        this.reader.getRewardCategoryPath(gameId, null),
        null,
        newRewardCategory(rewardCategoryId, args));
  }
  updateRewardCategory(args) {
    let rewardCategoryPath = this.reader.pathForId(rewardCategoryId);
    for (let argName in args) {
      this.writer.set(rewardCategoryPath.concat([argName]), args[argName]);
    }
  }
  addNotificationCategory(args) {
    let {gameId, notificationCategoryId} = args;
    this.writer.insert(
        this.reader.getNotificationCategoryPath(gameId, null),
        null,
        newNotificationCategory(notificationCategoryId, args));
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
        newNotification(notificationId, properties));
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
        this.time);
  }
  addReward(args) {
    let {rewardCategoryId, rewardId} = args;
    let gameId = this.reader.getGameIdForRewardCategoryId(rewardCategoryId);
    this.writer.insert(
        this.reader.getRewardPath(gameId, rewardCategoryId, null),
        null,
        newReward(rewardId, Utils.merge(args, {
          code: "" + Math.random(),
          rewardCategoryId: rewardCategoryId,
          playerId: null,
        })));
  }
  addRewards(rewardCategoryId, numToAdd) {
    for (let i = 0; i < numToAdd; i++) {
      let rewardId = Bridge.RewardId.generate();
      let code = Math.random() * Math.pow(2, 52);
      this.addReward({id: rewardId, rewardCategoryId: rewardCategoryId, code: code});
    }
  }
  addGun(args) {
    let properties = Utils.copyOf(args);
    properties.id = args.gunId;
    delete properties.gunId;
    properties.playerId = null;
    this.writer.insert(
        this.reader.getGunPath(null),
        null,
        properties);
  }
  claimReward(playerId, code) {
    assert(typeof code == 'string');
    code = code.replace(/\s/g, '').toLowerCase();
    // let playerPath = this.reader.pathForId(playerId);
    // let gamePath = playerPath.slice(0, 2);
    let gameId = this.getGameIdForPlayerId(playerId);
    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerId];

    // let rewardCategoriesPath = gamePath.concat(["rewardCategories"]);
    for (let i = 0; i < game.rewardCategories.length; i++) {
      let rewardCategory = rewardCategories[i];
      for (let j = 0; j < rewardCategory.rewards.length; j++) {
        let reward = rewardCategory.rewards[j];
        if (reward.code.replace(/\s/g, '').toLowerCase() == code) {
          this.writer.set(
              gamePath.concat(["rewardCategories", i, "rewards", j, "playerId"]),
              playerId);
          this.writer.insert(
              playerPath.concat(["rewards"]),
              null,
              newClaim(Bridge.ClaimId.generate(), {
                rewardCategoryId: rewardCategory.id,
                rewardId: reward.id,
              }));
          return;
        }
      }
    }
    assert(false);
  }
  assignGun(args) {
    let {gunId, playerId} = args;
    let gunPath = this.reader.getGunPath(gunId);
    this.writer.set(gunPath.concat(["playerId"]), playerId);
  }
  selfInfect(args) {
    let {playerId} = args;
    this.setPlayerZombie(playerId);
  }
  joinResistance(args, lifeCodeHint) {
    let {playerId} = args;
    this.addLife({lifeId: Bridge.LifeId.generate(), playerId: playerId}, lifeCodeHint);
    this.setPlayerHuman(playerId);
    this.autoAddPlayerToGroups_(playerId);
  }
  joinHorde(args) {
    let {playerId} = args;
    this.setPlayerZombie(playerId);
    this.autoAddPlayerToGroups_(playerId);
  }
  autoRemovePlayerFromGroups_(playerId) {
    let gameId = this.reader.getGameIdForPlayerId(playerId);
    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerId];
    for (let group of this.database.gamesById[gameId].groups) {
      if (group.autoRemove) {
        if (group.allegianceFilter && group.allegianceFilter != player.allegiance) {
          this.removePlayerFromGroup({groupId: group.id, playerToRemoveId: playerId});
        }
      }
    }
  }
  autoAddPlayerToGroups_(playerId) {
    let gameId = this.reader.getGameIdForPlayerId(playerId);
    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerId];
    for (let group of this.database.gamesById[gameId].groups) {
      if (group.autoAdd) {
        if (!group.allegianceFilter || group.allegianceFilter == player.allegiance) {
          this.addPlayerToGroup({groupId: group.id, playerToAddId: playerId});
        }
      }
    }
  }
  updateMembershipsOnAllegianceChange(playerId) {
    let gameId = this.reader.getGameIdForPlayerId(playerId);
    let game = this.database.gamesById[gameId];
    let player = game.playersById[playerId];
    let oldChatRoomMemberships = player.chatRoomMemberships.slice();
    for (let chatRoomMembership of oldChatRoomMemberships) {
      let chatRoom = game.chatRoomsById[chatRoomMembership.chatRoomId];
      let group = game.groupsById[chatRoom.groupId];
      if (group.autoRemove) {
        if (group.allegianceFilter && group.allegianceFilter != player.allegiance) {
          this.removePlayerFromGroup({groupId: group.id, playerToRemoveId: playerId});
        }
      }
    }
    for (let chatRoom of this.database.gamesById[gameId].chatRooms) {
      let group = this.database.gamesById[gameId].groupsById[chatRoom.groupId];
      if (group.autoAdd) {
        if (!group.allegianceFilter || group.allegianceFilter == player.allegiance) {
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
      throw 'No player found with life code ' + infecteeLifeCode;
    }
  }
  infect(args) {
    let {infectionId, playerId, infecteeLifeCode, infecteePlayerId} = args;
    let infectorPlayerId = playerId;
    let gameId = this.reader.getGameIdForPlayerId(infectorPlayerId || infecteePlayerId);
    let infecteePlayer = this.findPlayerByIdOrLifeCode_(gameId, infecteePlayerId, infecteeLifeCode);
    let infectorPlayerPath = this.reader.getPlayerPath(gameId, infectorPlayerId);
    this.writer.set(
        this.reader.getPlayerPath(gameId, infectorPlayerId).concat(["points"]),
        this.reader.get(infectorPlayerPath.concat(["points"])) + 2);
    let infecteePlayerPath = this.reader.getPlayerPath(gameId, infecteePlayer.id);
    this.writer.insert(
        infecteePlayerPath.concat(["infections"]),
        null,
        newInfection(Bridge.InfectionId.generate(), {
          infectorId: infectorPlayerId,
          time: this.time,
        }));
    infecteePlayer = this.reader.get(infecteePlayerPath);
    if (infecteePlayer.infections.length >= infecteePlayer.lives.length) {
      this.setPlayerZombie(infecteePlayer.id);
    }
    return infecteePlayer.id;
  }
  addLife(args, codeHint) {
    let {lifeId, playerId} = args;
    let code = codeHint || "codefor-" + lifeId;
    let gameId = this.reader.getGameIdForPlayerId(playerId);
    let playerPath = this.reader.getPlayerPath(gameId, playerId);
    this.writer.insert(
        this.reader.getLifePath(gameId, playerId, null),
        null,
        newLife(lifeId, {
          code: code,
          time: this.time,
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
        newQuizQuestion(quizQuestionId, args));
  }
  addQuizAnswer(args) {
    let {quizAnswerId, quizQuestionId} = args;
    let gameId = this.reader.getGameIdForQuizQuestionId(quizQuestionId);
    this.writer.insert(
        this.reader.getQuizAnswerPath(gameId, quizQuestionId, null),
        null,
        newQuizAnswer(quizAnswerId, args));
  }
}
