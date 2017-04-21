'use strict';

class FakeServer {
  constructor(delegate) {
    this.delegate = delegate;
    this.database = new FakeDatabase({
      broadcastOperation: (operation) => this.delegate.broadcastDatabaseOperation(operation),
      onUserSignedIn: (userId) => this.delegate.onUserSignedIn(userId),
    });
    window.fakeServer = this;
  }
  getGameIndex(gameId) {
    return Utils.findIndexById(this.database.get(["games"]), gameId);
  }
  getUserIndex(userId) {
    return Utils.findIndexById(this.database.get(["users"]), userId);
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
    assert(id.endsWith(type));
    let found = this.database.objForId(id, true);
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
    this.database.push(["users"], {
      id: userId,
      players: [],
    });
  }
  createGame(gameId, adminUserId, args) {
    this.checkIdNotTaken(gameId, 'game');
    this.checkRequestArgs(args, SERVER_GAME_PROPERTIES);
    let {name, number, rulesUrl, stunTimer} = args;
    this.database.push(["games"], {
      id: gameId,
      name: name,
      number: number,
      rulesUrl: rulesUrl,
      stunTimer: stunTimer,
      admins: [],
      players: [],
      missions: [],
      chatRooms: [],
      notificationCategories: [],
      rewardCategories: [],
    });
    this.addAdmin(Bridge.generateAdminId(), gameId, adminUserId);
  }
  addAdmin(adminId, gameId, adminUserId) {
    this.checkIdNotTaken(adminId, 'admin');
    this.checkId(gameId, 'game');
    this.checkId(adminUserId, 'user');
    let gamePath = this.database.pathForId(gameId);
    this.database.push(gamePath.concat(["admins"]), {
      id: adminId,
      userId: adminUserId,
    });
  }
  joinGame(playerId, userId, gameId, args) {
    this.checkIdNotTaken(playerId, 'player');
    this.checkId(userId, 'user');
    this.checkId(gameId, 'game');
    this.checkRequestArgs(args, SERVER_PLAYER_PROPERTIES);
    let {name, needGun, profileImageUrl, startAsZombie, volunteer} = args;
    let existingPlayers = this.database.get(["games", this.getGameIndex(gameId), "players"]);
    this.database.push(["games", this.getGameIndex(gameId), "players"], {
      id: playerId,
      allegiance: "horde",
      infectable: false,
      infections: [],
      lives: [],
      name: name,
      needGun: needGun,
      notifications: [],
      number: existingPlayers.length,
      points: 0,
      profileImageUrl: profileImageUrl,
      rewards: [],
      startAsZombie: startAsZombie,
      userId: userId,
      volunteer: volunteer,
      rewards: [],
    });
    this.database.push(["users", this.getUserIndex(userId), "players"], {
      id: Bridge.generateUserPlayerId(),
      gameId: gameId,
      playerId: playerId,
    });
  }
  createChatRoom(chatRoomId, firstPlayerId, args) {
    this.checkIdNotTaken(chatRoomId, 'chatRoom');
    this.checkId(firstPlayerId, 'player');
    let firstPlayerPath = this.database.pathForId(firstPlayerId);
    let gamePath = firstPlayerPath.slice(0, 2);
    this.checkRequestArgs(args, SERVER_CHAT_ROOM_PROPERTIES);
    let {name, allegianceFilter} = args;
    this.database.push(gamePath.concat(["chatRooms"]), {
      id: chatRoomId,
      name: name,
      allegianceFilter: allegianceFilter,
      messages: [],
      memberships: [],
    });
  }
  updatePlayer(playerId, args) {
    this.checkId(playerId, 'player');
    let playerPath = this.database.pathForId(playerId);
    this.checkOptionalRequestArgs(args, SERVER_PLAYER_PROPERTIES);
    for (let argName in args) {
      this.database.set(playerPath.concat([argName]), args[argName]);
    }
  }
  addPlayerToChatRoom(chatRoomId, playerId) {
    this.checkId(chatRoomId, 'chatRoom');
    let chatRoomPath = this.database.pathForId(chatRoomId);
    this.checkId(playerId, 'player');
    this.database.push(chatRoomPath.concat(["memberships"]), {
      id: Bridge.generateMembershipId(),
      playerId: playerId,
    });
  }
  addMessageToChatRoom(messageId, chatRoomId, playerId, args) {
    this.checkId(playerId, 'player');
    this.checkId(chatRoomId, 'chatRoom');
    let chatRoomPath = this.database.pathForId(chatRoomId);
    this.checkRequestArgs(args, SERVER_MESSAGE_PROPERTIES);
    let {message} = args;
    this.database.push(chatRoomPath.concat(["messages"]), {
      id: messageId,
      playerId: playerId,
      message: message,
      time: new Date().getTime() / 1000,
    });
  }
  addMission(missionId, gameId, args) {
    this.checkIdNotTaken(missionId, 'mission');
    this.checkId(gameId, 'game');
    this.checkRequestArgs(args, SERVER_MISSION_PROPERTIES);
    let {beginTime, endTime, name, url, allegianceFilter} = args;
    this.database.push(["games", this.getGameIndex(gameId), "missions"], {
      id: missionId,
      beginTime: beginTime,
      endTime: endTime,
      name: name,
      url: url,
      allegianceFilter: allegianceFilter,
    });
  }
  updateMission(missionId, args) {
    this.checkId(missionId, 'mission');
    let missionPath = this.database.pathForId(missionId);
    this.checkOptionalRequestArgs(args, SERVER_MISSION_PROPERTIES);
    for (let argName in args) {
      this.database.set(missionPath.concat([argName]), args[argName]);
    }
  }
  addRewardCategory(rewardCategoryId, gameId, args) {
    this.checkIdNotTaken(rewardCategoryId, 'rewardCategory');
    this.checkId(gameId, 'game');
    this.checkRequestArgs(args, SERVER_REWARD_CATEGORY_PROPERTIES);
    let {name, points, seed} = args;
    this.database.push(["games", this.getGameIndex(gameId), "rewardCategories"], {
      id: rewardCategoryId,
      name: name,
      points: points,
      seed: seed,
      rewards: [],
    });
  }
  updateRewardCategory(rewardCategoryId, args) {
    this.checkId(rewardCategoryId, 'rewardCategory');
    let rewardCategoryPath = this.database.pathForId(rewardCategoryId);
    this.checkOptionalRequestArgs(args, SERVER_REWARD_CATEGORY_PROPERTIES);
    for (let argName in args) {
      this.database.set(rewardCategoryPath.concat([argName]), args[argName]);
    }
  }
  addNotificationCategory(notificationCategoryId, gameId, args) {
    this.checkIdNotTaken(notificationCategoryId, 'notificationCategory');
    this.checkId(gameId, 'game');
    this.checkRequestArgs(args, SERVER_NOTIFICATION_CATEGORY_PROPERTIES);
    let {name, message, previewMessage, sendTime, allegianceFilter, email, app, sound, vibrate} = args;
    this.database.push(["games", this.getGameIndex(gameId), "notificationCategories"], {
      id: notificationCategoryId,
      name: name,
      message: message,
      previewMessage: previewMessage,
      sendTime: sendTime,
      allegianceFilter: allegianceFilter,
      email: email,
      app: app,
      sound: sound,
      vibrate: vibrate,
    });
  }
  addNotification(notificationId, playerId, notificationCategoryId, args) {
    this.checkIdNotTaken(notificationId, 'notification');
    this.checkId(playerId, 'player');
    let playerPath = this.database.pathForId(playerId);
    this.checkId(notificationCategoryId, 'notificationCategory');
    let notificationCategoryPath = this.database.pathForId(notificationCategoryId);
    this.checkRequestArgs(args, SERVER_NOTIFICATION_PROPERTIES);
    let {message, previewMessage, sound, vibrate, app, destination} = args;
    this.database.push(playerPath.concat(["notifications"]), {
      id: notificationId,
      notificationCategoryId: notificationCategoryId,
      message: message,
      previewMessage: previewMessage,
      seenTime: null,
      sound: sound,
      vibrate: vibrate,
      app: app,
      destination: destination,
    });
  }
  updateNotificationCategory(notificationCategoryId, args) {
    this.checkId(notificationCategoryId, 'notificationCategory');
    let notificationCategoryPath = this.database.pathForId(notificationCategoryId);
    this.checkOptionalRequestArgs(args, SERVER_NOTIFICATION_CATEGORY_PROPERTIES);
    for (let argName in args) {
      this.database.set(notificationCategoryPath.concat([argName]), args[argName]);
    }
  }
  markNotificationSeen(notificationId) {
    this.checkId(notificationId, 'notification');
    let notificationPath = this.database.pathForId(notificationId);
    this.database.set(notificationPath.concat(["seenTime"]), new Date() / 1000);
  }
  addReward(rewardId, rewardCategoryId, args) {
    this.checkIdNotTaken(rewardId, 'reward');
    this.checkId(rewardCategoryId, 'rewardCategory');
    let rewardCategoryPath = this.database.pathForId(rewardCategoryId);
    this.checkRequestArgs(args, SERVER_REWARD_PROPERTIES);
    let {code} = args;
    this.database.push(rewardCategoryPath.concat(["rewards"]), {
      id: rewardId,
      rewardCategoryId: rewardCategoryId,
      code: code,
      playerId: null,
    });
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
    let {number} = args;
    this.database.push(["guns"], {
      id: gunId,
      number: number,
      playerId: null,
    });
  }
  claimReward(playerId, code) {
    assert(typeof code == 'string');
    code = code.replace(/\s/g, '').toLowerCase();
    this.checkId(playerId, 'player');
    let playerPath = this.database.pathForId(playerId);
    let gamePath = playerPath.slice(0, 2);
    let rewardCategoriesPath = gamePath.concat(["rewardCategories"]);
    let rewardCategories = this.database.get(rewardCategoriesPath);
    for (let i = 0; i < rewardCategories.length; i++) {
      let rewardCategory = rewardCategories[i];
      for (let j = 0; j < rewardCategory.rewards.length; j++) {
        let reward = rewardCategory.rewards[j];
        if (reward.code.replace(/\s/g, '').toLowerCase() == code) {
          this.database.set(gamePath.concat(["rewardCategories", i, "rewards", j, "playerId"]), playerId);
          this.database.push(playerPath.concat(["rewards"]), {
            id: Bridge.generatePlayerRewardId(),
            rewardCategoryId: rewardCategory.id,
            rewardId: reward.id,
          });
          return;
        }
      }
    }
    assert(false);
  }
  setGunPlayer(gunId, playerId) {
    this.checkId(gunId, 'gun');
    let gunPath = this.database.pathForId(gunId);
    playerId && this.checkId(playerId, 'player');
    this.database.set(gunPath.concat(["playerId"]), playerId);
  }
  infect(infectionId, infectorPlayerId, infecteeLifeCode) {
    this.checkId(infectorPlayerId, 'player');
    let infectorPlayerPath = this.database.pathForId(infectorPlayerId);
    let gameId = infectorPlayerPath[1];
    let players = this.database.get(["games", gameId, "players"]);
    let infecteePlayerIndex = null;
    let infecteePlayer = null;
    for (let i = 0; i < players.length; i++) {
      let player = players[i];
      if (player.lives.length) {
        let life = player.lives[player.lives.length - 1];
        if (life.code == infecteeLifeCode) {
          infecteePlayerIndex = i;
          infecteePlayer = player;
          break;
        }
      }
    }
    if (!infecteePlayer) {
      throw 'No player found with life code ' + infecteeLifeCode;
    }
    this.database.set(infectorPlayerPath.concat(["points"]),
        this.database.get(infectorPlayerPath.concat(["points"])) + 2);
    let infecteePlayerPath = ["games", gameId, "players", infecteePlayerIndex];
    this.database.push(infecteePlayerPath.concat(["infections"]), {
      id: Bridge.generateInfectionId(),
      infectorPlayerId: infectorPlayerId,
    });
    infecteePlayer = this.database.get(infecteePlayerPath);
    if (infecteePlayer.infections.length >= infecteePlayer.lives.length) {
      this.database.set(infecteePlayerPath.concat(["infectable"]), false);
      this.database.set(infecteePlayerPath.concat(["allegiance"]), "horde");
    }
  }
  addLife(lifeId, playerId, code) {
    this.checkId(playerId, 'player');
    let playerPath = this.database.pathForId(playerId);
    this.database.push(playerPath.concat(["lives"]), {
      id: lifeId,
      code: code,
    });
    let player = this.database.get(playerPath);
    if (player.lives.length > player.infections.length) {
      this.database.set(playerPath.concat(["infectable"]), true);
      this.database.set(playerPath.concat(["allegiance"]), "resistance");
    }
  }
}
