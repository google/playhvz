'use strict';

class FakeServer {
  constructor(delegate) {
    this.delegate = delegate;
    this.localDb = new LocalDatabase(new FakeDatabase({
      broadcastOperation: (operation) => this.delegate.broadcastDatabaseOperation(operation),
      onUserSignedIn: (userId) => this.delegate.onUserSignedIn(userId),
    }));
    window.fakeServer = this;
  }
  checkRequestArgs(args, paramNames, optional) {
    assert(typeof args == 'object');
    assert(paramNames instanceof Array);
    for (var argName in args) {
      assert(paramNames.indexOf(argName) >= 0);
    }
    if (!optional) {
      for (var paramName of paramNames) {
        assert(paramName in args);
      }
    }
    for (var argName in args) {
      let arg = args[argName];
      if (arg == null ||
          typeof arg == 'string' ||
          typeof arg == 'number' ||
          typeof arg == 'boolean') {
        // Good
      } else {
        throwError('Bad type for arg:', arg);
      }
    }
  }
  checkOptionalRequestArgs(args, paramNames) {
    this.checkRequestArgs(args, paramNames, true);
  }
  checkId(id, type, opt_existence) {
    assert(id);
    assert(id.startsWith(type + "-"));
    let found = this.localDb.idExists(id, true);
    let existence = (opt_existence == null ? true : opt_existence);
    if (existence)
      assert(found);
    else
      assert(!found);
    return found;
  }
  checkedGet(id, type) {
    return this.checkId(id, type);
  }
  checkIdNotTaken(id, type) {
    return this.checkId(id, type, false);
  }
  signIn(preferredUserId) {
    assert(preferredUserId);
    return preferredUserId;
  }
  register(userId, args) {
    this.checkIdNotTaken(userId, 'user');
    this.checkRequestArgs(args, SERVER_USER_PROPERTIES);
    this.localDb.insert(this.localDb.getUserPath(null), null, {
      id: userId,
      players: [],
    });
  }
  createGame(gameId, adminUserId, args) {
    this.checkIdNotTaken(gameId, 'game');
    this.checkRequestArgs(args, SERVER_GAME_PROPERTIES);
    this.localDb.insert(
        this.localDb.getGamePath(null),
        null,
        newGame(gameId, args));
    this.addAdmin(Bridge.generateAdminId(), gameId, adminUserId);
  }
  addAdmin(adminId, gameId, adminUserId) {
    this.checkIdNotTaken(adminId, 'admin');
    this.checkId(gameId, 'game');
    this.checkId(adminUserId, 'user');
    this.localDb.insert(
        this.localDb.getAdminPath(gameId, null),
        null,
        newAdmin(adminId, {userId: adminUserId}));
  }
  joinGame(playerId, userId, gameId, args) {
    this.checkIdNotTaken(playerId, 'player');
    this.checkId(userId, 'user');
    this.checkId(gameId, 'game');
    this.checkRequestArgs(args, SERVER_PLAYER_PROPERTIES);
    let existingPlayers = this.localDb.get(this.localDb.getPlayerPath(gameId, null));
    this.localDb.insert(
        this.localDb.getPlayerPath(gameId, null),
        null,
        newPlayer(playerId, Utils.merge(args, {
            allegiance: 'horde',
            userId: userId,
            infectable: false,
            points: 0,
            number: existingPlayers.length
        })));
    this.localDb.insert(
        this.localDb.getUserPlayerPath(userId, null),
        null,
        newUserPlayer(Bridge.generateUserPlayerId(), {
            gameId: gameId,
            playerId: playerId
        }));
  }
  createChatRoom(chatRoomId, firstPlayerId, args) {
    this.checkIdNotTaken(chatRoomId, 'chatRoom');
    this.checkId(firstPlayerId, 'player');
    this.checkRequestArgs(args, SERVER_CHAT_ROOM_PROPERTIES);
    let gameId = this.localDb.getGameIdForPlayerId(firstPlayerId);
    this.localDb.insert(
        this.localDb.getChatRoomPath(gameId, null),
        null,
        newChatRoom(chatRoomId, args));
  }
  updatePlayer(playerId, args) {
    this.checkId(playerId, 'player');
    this.checkOptionalRequestArgs(args, SERVER_PLAYER_PROPERTIES);
    let gameId = this.localDb.getGameIdForPlayerId(playerId);
    for (let argName in args) {
      this.localDb.set(
          this.localDb.getPlayerPath(gameId, playerId).concat([argName]),
          args[argName]);
    }
  }
  addPlayerToChatRoom(chatRoomId, playerId) {
    this.checkId(chatRoomId, 'chatRoom');
    this.checkId(playerId, 'player');
    let gameId = this.localDb.getGameIdForChatRoomId(chatRoomId);
    this.localDb.insert(
        this.localDb.getMembershipPath(gameId, chatRoomId, null),
        null,
        newMembership(Bridge.generateMembershipId(), {playerId: playerId}));
  }
  addMessageToChatRoom(messageId, chatRoomId, playerId, args) {
    this.checkId(playerId, 'player');
    this.checkId(chatRoomId, 'chatRoom');
    this.checkRequestArgs(args, SERVER_MESSAGE_PROPERTIES);
    let gameId = this.localDb.getGameIdForChatRoomId(chatRoomId);
    this.localDb.insert(
        this.localDb.getChatRoomPath(gameId, chatRoomId).concat(["messages"]),
        null,
        newMessage(messageId, Utils.merge(args, {
          time: new Date().getTime() / 1000,
          playerId: playerId,
        })));
  }
  addMission(missionId, gameId, args) {
    this.checkIdNotTaken(missionId, 'mission');
    this.checkId(gameId, 'game');
    this.checkRequestArgs(args, SERVER_MISSION_PROPERTIES);
    this.localDb.insert(
        this.localDb.getMissionPath(gameId, null),
        null,
        newMission(missionId, args));
  }
  updateMission(missionId, args) {
    this.checkId(missionId, 'mission');
    let missionPath = this.localDb.pathForId(missionId);
    this.checkOptionalRequestArgs(args, SERVER_MISSION_PROPERTIES);
    for (let argName in args) {
      this.localDb.set(missionPath.concat([argName]), args[argName]);
    }
  }
  addRewardCategory(rewardCategoryId, gameId, args) {
    this.checkIdNotTaken(rewardCategoryId, 'rewardCategory');
    this.checkId(gameId, 'game');
    this.checkRequestArgs(args, SERVER_REWARD_CATEGORY_PROPERTIES);
    let {name, points, seed} = args;
    this.localDb.insert(
        this.localDb.getRewardCategoryPath(gameId, null),
        null,
        newRewardCategory(rewardCategoryId, args));
  }
  updateRewardCategory(rewardCategoryId, args) {
    this.checkId(rewardCategoryId, 'rewardCategory');
    let rewardCategoryPath = this.localDb.pathForId(rewardCategoryId);
    this.checkOptionalRequestArgs(args, SERVER_REWARD_CATEGORY_PROPERTIES);
    for (let argName in args) {
      this.localDb.set(rewardCategoryPath.concat([argName]), args[argName]);
    }
  }
  addNotificationCategory(notificationCategoryId, gameId, args) {
    this.checkIdNotTaken(notificationCategoryId, 'notificationCategory');
    this.checkId(gameId, 'game');
    this.checkRequestArgs(args, SERVER_NOTIFICATION_CATEGORY_PROPERTIES);
    this.localDb.insert(
        this.localDb.getNotificationCategoryPath(gameId, null),
        null,
        newNotificationCategory(notificationCategoryId, args));
  }
  addNotification(notificationId, playerId, notificationCategoryId, args) {
    this.checkIdNotTaken(notificationId, 'notification');
    this.checkId(playerId, 'player');
    this.checkId(notificationCategoryId, 'notificationCategory');
    this.checkRequestArgs(args, SERVER_NOTIFICATION_PROPERTIES);
    let properties = Utils.copyOf(args);
    properties.seenTime = null;
    properties.notificationCategoryId = notificationCategoryId;
    let gameId = this.localDb.getGameIdForPlayerId(playerId);
    this.localDb.insert(
        this.localDb.getNotificationPath(gameId, playerId, null),
        null,
        newNotification(notificationId, properties));
  }
  updateNotificationCategory(notificationCategoryId, args) {
    this.checkId(notificationCategoryId, 'notificationCategory');
    let notificationCategoryPath = this.localDb.pathForId(notificationCategoryId);
    this.checkOptionalRequestArgs(args, SERVER_NOTIFICATION_CATEGORY_PROPERTIES);
    for (let argName in args) {
      this.localDb.set(notificationCategoryPath.concat([argName]), args[argName]);
    }
  }
  markNotificationSeen(notificationId) {
    this.checkId(notificationId, 'notification');
    let [gameId, playerId] = this.localDb.getGameIdAndPlayerIdForNotificationId(notificationId);
    this.localDb.set(
        this.localDb.getNotificationPath(gameId, playerId, notificationId).concat(["seenTime"]),
        new Date() / 1000);
  }
  addReward(rewardId, rewardCategoryId, args) {
    this.checkIdNotTaken(rewardId, 'reward');
    this.checkId(rewardCategoryId, 'rewardCategory');
    this.checkRequestArgs(args, SERVER_REWARD_PROPERTIES);
    let gameId = this.localDb.getGameIdForRewardCategoryId(rewardCategoryId);
    this.localDb.insert(
        this.localDb.getRewardPath(gameId, rewardCategoryId, null),
        null,
        newReward(rewardId, Utils.merge(args, {
          code: "" + Math.random(),
          rewardCategoryId: rewardCategoryId,
          playerId: null,
        })));
  }
  addRewards(rewardCategoryId, numToAdd) {
    for (let i = 0; i < numToAdd; i++) {
      let rewardId = Bridge.generateRewardId();
      let code = Math.random() * Math.pow(2, 52);
      this.addReward(rewardId, rewardCategoryId, {code: code});
    }
  }
  addGun(gunId, args) {
    this.checkIdNotTaken(gunId, 'gun');
    this.checkRequestArgs(args, SERVER_GUN_PROPERTIES);
    let properties = Utils.copyOf(args);
    properties.playerId = null;
    this.localDb.insert(
        this.localDb.getGunPath(null),
        null,
        properties);
  }
  claimReward(playerId, code) {
    assert(typeof code == 'string');
    code = code.replace(/\s/g, '').toLowerCase();
    this.checkId(playerId, 'player');
    let playerPath = this.localDb.pathForId(playerId);
    let gamePath = playerPath.slice(0, 2);
    let rewardCategoriesPath = gamePath.concat(["rewardCategories"]);
    let rewardCategories = this.localDb.get(rewardCategoriesPath);
    for (let i = 0; i < rewardCategories.length; i++) {
      let rewardCategory = rewardCategories[i];
      for (let j = 0; j < rewardCategory.rewards.length; j++) {
        let reward = rewardCategory.rewards[j];
        if (reward.code.replace(/\s/g, '').toLowerCase() == code) {
          this.localDb.set(
              gamePath.concat(["rewardCategories", i, "rewards", j, "playerId"]),
              playerId);
          this.localDb.insert(
              playerPath.concat(["rewards"]),
              null,
              newClaim(Bridge.generateClaimId(), {
                rewardCategoryId: rewardCategory.id,
                rewardId: reward.id,
              }));
          return;
        }
      }
    }
    assert(false);
  }
  setGunPlayer(gunId, playerId) {
    this.checkId(gunId, 'gun');
    let gunPath = this.localDb.pathForId(gunId);
    playerId && this.checkId(playerId, 'player');
    this.localDb.set(gunPath.concat(["playerId"]), playerId);
  }
  infect(infectionId, infectorPlayerId, infecteeLifeCode) {
    this.checkId(infectorPlayerId, 'player');
    let gameId = this.localDb.getGameIdForPlayerId(infectorPlayerId);
    let players = this.localDb.get(this.localDb.getPlayerPath(gameId, null));
    let infecteePlayer = null;
    for (let i = 0; i < players.length; i++) {
      let player = players[i];
      if (player.lives.length) {
        let life = player.lives[player.lives.length - 1];
        if (life.code == infecteeLifeCode) {
          infecteePlayer = player;
          break;
        }
      }
    }
    if (!infecteePlayer) {
      throw 'No player found with life code ' + infecteeLifeCode;
    }
    let infectorPlayerPath = this.localDb.getPlayerPath(gameId, infectorPlayerId);
    this.localDb.set(
        this.localDb.getPlayerPath(gameId, infectorPlayerId).concat(["points"]),
        this.localDb.get(infectorPlayerPath.concat(["points"])) + 2);
    let infecteePlayerPath = this.localDb.getPlayerPath(gameId, infecteePlayer.id);
    this.localDb.insert(
        infecteePlayerPath.concat(["infections"]),
        null,
        newInfection(Bridge.generateInfectionId(), {
          infectorPlayerId: infectorPlayerId,
        }));
    infecteePlayer = this.localDb.get(infecteePlayerPath);
    if (infecteePlayer.infections.length >= infecteePlayer.lives.length) {
      this.localDb.set(infecteePlayerPath.concat(["infectable"]), false);
      this.localDb.set(infecteePlayerPath.concat(["allegiance"]), "horde");
    }
  }
  addLife(lifeId, playerId, code) {
    this.checkId(playerId, 'player');
    let gameId = this.localDb.getGameIdForPlayerId(playerId);
    let playerPath = this.localDb.getPlayerPath(gameId, playerId);
    this.localDb.insert(
        this.localDb.getLifePath(gameId, playerId, null),
        null,
        newLife(lifeId, {code: code}));
    let player = this.localDb.get(playerPath);
    if (player.lives.length > player.infections.length) {
      this.localDb.set(playerPath.concat(["infectable"]), true);
      this.localDb.set(playerPath.concat(["allegiance"]), "resistance");
    }
  }
}
