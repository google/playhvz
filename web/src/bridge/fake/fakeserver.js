'use strict';

class FakeServer {
  constructor(destination) {
    this.destination = destination;

    this.database = {};
    var writer = new SimpleWriter(this.database);
    var mappingWriter = new MappingWriter(writer);
    var teeWriter = new TeeWriter(mappingWriter, new MappingWriter(destination));
    this.writer = teeWriter;

    this.reader = new Reader(new SimpleReader(this.database));

    this.writer.set(this.reader.getGunPath(null), []);
    this.writer.set(this.reader.getGamePath(null), []);
    this.writer.set(this.reader.getUserPath(null), []);

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
    let found = this.reader.idExists(id, true);
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
    this.writer.insert(this.reader.getUserPath(null), null, {
      id: userId,
      players: [],
    });
  }
  createGame(gameId, adminUserId, args) {
    this.checkIdNotTaken(gameId, 'game');
    this.checkRequestArgs(args, SERVER_GAME_PROPERTIES);
    this.writer.insert(
        this.reader.getGamePath(null),
        null,
        newGame(gameId, args));
    this.addAdmin(Bridge.generateAdminId(), gameId, adminUserId);
  }
  addAdmin(adminId, gameId, adminUserId) {
    this.checkIdNotTaken(adminId, 'admin');
    this.checkId(gameId, 'game');
    this.checkId(adminUserId, 'user');
    this.writer.insert(
        this.reader.getAdminPath(gameId, null),
        null,
        newAdmin(adminId, {userId: adminUserId}));
  }
  joinGame(playerId, userId, gameId, args) {
    this.checkIdNotTaken(playerId, 'player');
    this.checkId(userId, 'user');
    this.checkId(gameId, 'game');
    this.checkRequestArgs(args, SERVER_PLAYER_PROPERTIES);
    let existingPlayers = this.reader.get(this.reader.getPlayerPath(gameId, null));
    this.writer.insert(
        this.reader.getPlayerPath(gameId, null),
        null,
        newPlayer(playerId, Utils.merge(args, {
            allegiance: 'horde',
            userId: userId,
            infectable: false,
            points: 0,
            number: existingPlayers.length
        })));
    this.writer.insert(
        this.reader.getUserPlayerPath(userId, null),
        null,
        newUserPlayer(playerId, {
            gameId: gameId,
            playerId: playerId
        }));
  }
  createChatRoom(chatRoomId, firstPlayerId, args) {
    this.checkIdNotTaken(chatRoomId, 'chatRoom');
    this.checkId(firstPlayerId, 'player');
    this.checkRequestArgs(args, SERVER_CHAT_ROOM_PROPERTIES, true);
    let gameId = this.reader.getGameIdForPlayerId(firstPlayerId);
    this.writer.insert(
        this.reader.getChatRoomPath(gameId, null),
        null,
        newChatRoom(chatRoomId, args));
    this.writer.insert(
        this.reader.getMembershipPath(gameId, chatRoomId, null),
        null,
        newMembership(Bridge.generateMembershipId(), {playerId: firstPlayerId}));

  }
  updatePlayer(playerId, args) {
    this.checkId(playerId, 'player');
    this.checkOptionalRequestArgs(args, SERVER_PLAYER_PROPERTIES);
    let gameId = this.reader.getGameIdForPlayerId(playerId);
    for (let argName in args) {
      this.writer.set(
          this.reader.getPlayerPath(gameId, playerId).concat([argName]),
          args[argName]);
    }
  }
  addPlayerToChatRoom(chatRoomId, playerId) {
    this.checkId(chatRoomId, 'chatRoom');
    this.checkId(playerId, 'player');
    let gameId = this.reader.getGameIdForChatRoomId(chatRoomId);
    this.writer.insert(
        this.reader.getMembershipPath(gameId, chatRoomId, null),
        null,
        newMembership(Bridge.generateMembershipId(), {playerId: playerId}));
  }
  addMessageToChatRoom(messageId, chatRoomId, playerId, args) {
    this.checkId(playerId, 'player');
    this.checkId(chatRoomId, 'chatRoom');
    this.checkRequestArgs(args, SERVER_MESSAGE_PROPERTIES);
    let gameId = this.reader.getGameIdForChatRoomId(chatRoomId);
    this.writer.insert(
        this.reader.getChatRoomPath(gameId, chatRoomId).concat(["messages"]),
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
    this.writer.insert(
        this.reader.getMissionPath(gameId, null),
        null,
        newMission(missionId, args));
  }
  updateMission(missionId, args) {
    this.checkId(missionId, 'mission');
    let missionPath = this.reader.pathForId(missionId);
    this.checkOptionalRequestArgs(args, SERVER_MISSION_PROPERTIES);
    for (let argName in args) {
      this.writer.set(missionPath.concat([argName]), args[argName]);
    }
  }
  addRewardCategory(rewardCategoryId, gameId, args) {
    this.checkIdNotTaken(rewardCategoryId, 'rewardCategory');
    this.checkId(gameId, 'game');
    this.checkRequestArgs(args, SERVER_REWARD_CATEGORY_PROPERTIES);
    let {name, points, seed} = args;
    this.writer.insert(
        this.reader.getRewardCategoryPath(gameId, null),
        null,
        newRewardCategory(rewardCategoryId, args));
  }
  updateRewardCategory(rewardCategoryId, args) {
    this.checkId(rewardCategoryId, 'rewardCategory');
    let rewardCategoryPath = this.reader.pathForId(rewardCategoryId);
    this.checkOptionalRequestArgs(args, SERVER_REWARD_CATEGORY_PROPERTIES);
    for (let argName in args) {
      this.writer.set(rewardCategoryPath.concat([argName]), args[argName]);
    }
  }
  addNotificationCategory(notificationCategoryId, gameId, args) {
    this.checkIdNotTaken(notificationCategoryId, 'notificationCategory');
    this.checkId(gameId, 'game');
    this.checkRequestArgs(args, SERVER_NOTIFICATION_CATEGORY_PROPERTIES);
    this.writer.insert(
        this.reader.getNotificationCategoryPath(gameId, null),
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
    let gameId = this.reader.getGameIdForPlayerId(playerId);
    this.writer.insert(
        this.reader.getNotificationPath(gameId, playerId, null),
        null,
        newNotification(notificationId, properties));
  }
  updateNotificationCategory(notificationCategoryId, args) {
    this.checkId(notificationCategoryId, 'notificationCategory');
    let notificationCategoryPath = this.reader.pathForId(notificationCategoryId);
    this.checkOptionalRequestArgs(args, SERVER_NOTIFICATION_CATEGORY_PROPERTIES);
    for (let argName in args) {
      this.writer.set(notificationCategoryPath.concat([argName]), args[argName]);
    }
  }
  markNotificationSeen(notificationId) {
    this.checkId(notificationId, 'notification');
    let [gameId, playerId] = this.reader.getGameIdAndPlayerIdForNotificationId(notificationId);
    this.writer.set(
        this.reader.getNotificationPath(gameId, playerId, notificationId).concat(["seenTime"]),
        new Date() / 1000);
  }
  addReward(rewardId, rewardCategoryId, args) {
    this.checkIdNotTaken(rewardId, 'reward');
    this.checkId(rewardCategoryId, 'rewardCategory');
    this.checkRequestArgs(args, SERVER_REWARD_PROPERTIES);
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
    this.writer.insert(
        this.reader.getGunPath(null),
        null,
        properties);
  }
  claimReward(playerId, code) {
    assert(typeof code == 'string');
    code = code.replace(/\s/g, '').toLowerCase();
    this.checkId(playerId, 'player');
    let playerPath = this.reader.pathForId(playerId);
    let gamePath = playerPath.slice(0, 2);
    let rewardCategoriesPath = gamePath.concat(["rewardCategories"]);
    let rewardCategories = this.reader.get(rewardCategoriesPath);
    for (let i = 0; i < rewardCategories.length; i++) {
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
    let gunPath = this.reader.pathForId(gunId);
    playerId && this.checkId(playerId, 'player');
    this.writer.set(gunPath.concat(["playerId"]), playerId);
  }
  infect(infectionId, infectorPlayerId, infecteeLifeCode) {
    this.checkId(infectorPlayerId, 'player');
    let gameId = this.reader.getGameIdForPlayerId(infectorPlayerId);
    let players = this.reader.get(this.reader.getPlayerPath(gameId, null));
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
    let infectorPlayerPath = this.reader.getPlayerPath(gameId, infectorPlayerId);
    this.writer.set(
        this.reader.getPlayerPath(gameId, infectorPlayerId).concat(["points"]),
        this.reader.get(infectorPlayerPath.concat(["points"])) + 2);
    let infecteePlayerPath = this.reader.getPlayerPath(gameId, infecteePlayer.id);
    this.writer.insert(
        infecteePlayerPath.concat(["infections"]),
        null,
        newInfection(Bridge.generateInfectionId(), {
          infectorPlayerId: infectorPlayerId,
        }));
    infecteePlayer = this.reader.get(infecteePlayerPath);
    if (infecteePlayer.infections.length >= infecteePlayer.lives.length) {
      this.writer.set(infecteePlayerPath.concat(["infectable"]), false);
      this.writer.set(infecteePlayerPath.concat(["allegiance"]), "horde");
    }
  }
  addLife(lifeId, playerId, code) {
    this.checkId(playerId, 'player');
    let gameId = this.reader.getGameIdForPlayerId(playerId);
    let playerPath = this.reader.getPlayerPath(gameId, playerId);
    this.writer.insert(
        this.reader.getLifePath(gameId, playerId, null),
        null,
        newLife(lifeId, {code: code}));
    let player = this.reader.get(playerPath);
    if (player.lives.length > player.infections.length) {
      this.writer.set(playerPath.concat(["infectable"]), true);
      this.writer.set(playerPath.concat(["allegiance"]), "resistance");
    }
  }
}
