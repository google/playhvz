'use strict';

const SERVER_PLAYER_PROPERTIES = ["name", "needGun", "profileImageUrl", "startAsZombie", "volunteer"];
const SERVER_GAME_PROPERTIES = ["name", "rulesUrl", "stunTimer"];
const SERVER_USER_PROPERTIES = [];
const SERVER_CHAT_ROOM_PROPERTIES = ["name", "allegianceFilter"];
const SERVER_MESSAGE_PROPERTIES = ["message"];
const SERVER_MISSION_PROPERTIES = ["beginTime", "endTime", "name", "url", "allegianceFilter"];
const SERVER_REWARD_CATEGORY_PROPERTIES = ["name", "points", "seed"];
const SERVER_REWARD_PROPERTIES = ["code"];
const SERVER_GUN_PROPERTIES = ["number"];


class FakeServer {
  constructor(delegate) {
    this.delegate = delegate;
    this.database = new FakeDatabase({
      broadcastOperation: (operation) => this.delegate.broadcastDatabaseOperation(operation),
      onUserSignedIn: (userId) => this.delegate.onUserSignedIn(userId),
    });
    window.fakeServer = this;
  }
  fill() {
    var kimUserId = Bridge.generateUserId();
    this.register(kimUserId, {});
    var evanUserId = Bridge.generateUserId();
    this.register(evanUserId, {});
    var zekeUserId = Bridge.generateUserId();
    this.register(zekeUserId, {});
    var gameId = Bridge.generateGameId();
    this.createGame(gameId, kimUserId, {name: "Test game", rulesUrl: "/firstgame/rules.html", stunTimer: 60});
    var kimPlayerId = Bridge.generatePlayerId();
    this.joinGame(kimPlayerId, kimUserId, gameId, {name: 'Kim the Ultimate', needGun: false, profileImageUrl: "", startAsZombie: false, volunteer: false});
    var evanPlayerId = Bridge.generatePlayerId();
    this.joinGame(evanPlayerId, evanUserId, gameId, {name: 'Evanpocalypse', needGun: true, profileImageUrl: "", startAsZombie: false, volunteer: false});
    var zekePlayerId = Bridge.generatePlayerId();
    this.joinGame(zekePlayerId, zekeUserId, gameId, {name: 'Zeke', needGun: false, profileImageUrl: "", startAsZombie: true, volunteer: true});
    // if you want to see your computer die, uncomment this
    for (let i = 0; i < 600; i++) {
      let userId = Bridge.generateUserId();
      this.register(userId, {});
      this.joinGame(Bridge.generatePlayerId(), userId, gameId, {name: 'Player' + i, needGun: false, profileImageUrl: "", startAsZombie: false, volunteer: false});
    }
    this.updatePlayer(kimPlayerId, {profileImageUrl: 'https://lh3.googleusercontent.com/GoKTAX0zAEt6PlzUkTn7tMeK-q1hwKDpzWsMJHBntuyR7ZKVtFXjRkbFOEMqrqxPWJ-7dbCXD7NbVgHd7VmkYD8bDzsjd23XYk0KyALC3BElIk65vKajjjRD_X2_VkLPOVejrZLpPpa2ebQVUHJF5UXVlkst0m6RRqs2SumRzC7EMmEeq9x_TurwKUJmj7PhNBPCeoDEh51jAIc-ZqvRfDegLgq-HtoyJAo91lbD6jqA2-TFufJfiPd4nOWnKhZkQmarxA8LQT0kOu7r3M5F-GH3pCbQqpH1zraha8CqvKxMGLW1i4CbDs1beXatKTdjYhb1D_MVnJ6h7O4WX3GULwNTRSIFVOrogNWm4jWLMKfKt3NfXYUsCOMhlpAI3Q8o1Qgbotfud4_HcRvvs6C6i17X-oQm8282rFu6aQiLXOv55FfiMnjnkbTokOA1OGDQrkBPbSVumz9ZE3Hr-J7w_G8itxqThsSzwtK6p5YR_9lnepWe0HRNKfUZ2x-a2ndT9m6aRXC_ymWHQGfdGPvTfHOPxUpY8mtX2vknmj_dn4dIuir1PpcN0DJVVuyuww3sOn-1YRFh80gBFvwFuMnKwz8GY8IX5gZmbrrBsy_FmwFDIvBcwNjZKd9fH2gkK5rk1AlWv12LsPBsrRIEaLvcSq7Iim9XSsiivzcNrLFG=w294-h488-no'});
    this.updatePlayer(evanPlayerId, {profileImageUrl: 'https://lh3.googleusercontent.com/WP1fewVG0CvERcnQnmxjf84IjnEBoDQBgdaxbNAECRa433neObfAjv_xI35DN67WhcCL9y-mgXmfYrZEBeJ2PYrtIeCK3KSdJ4HiEDUqxaaGsJAtu5C5ZjcABUHoySueEwO0yJWfhWPVbGoAFdP-ZquoXSF3yz4gnlN76W-ltDBglclLxKs-hR9dTjf_DiX9yGmmb5y8mp1Jb8BEw9Q-zx_j9EFkgTI0EA6T10pogxsfAWkrwXO7t37D0vI2OxzHJA51EQ4LZw1oZsIN7Uyqnh06LAJ_ykYhW2xuSCpu7QY7UPm9IbDcsDqj1eap7xvV9JW_EW2Y8Km5nS0ZoAd-Eo3zUe-2YFTc0OAVDwgbhowzo1gUeqfCEtxVHuT36Aq2LWayB6DzOL9TqubcF7qmjtNy_UIr-RY1d69xN-KqjFBoWLtS6rDhQurrfJNd5x-MYOEjCMrbsGmSXE8L7PskM3e_3-ZhIqfMn2I-4zeEZIUG8U2iHRWK-blaqsSY8uhmzNG6sqF-liyINagQF4l35oy7tpobueWs7aDjRrcJrGiQDrGHYV1E67J64Ae9FqXPHmORRpYcihQc6pI0JAmaiWwMJoqD0QMJF9koaDYANPEGbWlnWc_lFzhCO_L8yCkVtJIIItQv-loypR6XqILK32eoGeatnp5Q0x0OEm3W=s240-no'});
    var humanChatRoomId = Bridge.generateChatRoomId();
    this.createChatRoom(humanChatRoomId, kimPlayerId, {name: "Resistance Comms Hub", allegianceFilter: 'resistance'});
    this.addPlayerToChatRoom(humanChatRoomId, evanPlayerId);
    this.addPlayerToChatRoom(humanChatRoomId, kimPlayerId);
    this.addMessageToChatRoom(Bridge.generateMessageId(), humanChatRoomId, kimPlayerId, {message: 'hi'});
    var zedChatRoomId = Bridge.generateChatRoomId();
    this.createChatRoom(zedChatRoomId, evanPlayerId, {name: "Horde ZedLink", allegianceFilter: 'horde'});
    this.addPlayerToChatRoom(zedChatRoomId, zekePlayerId);
    this.addMessageToChatRoom(Bridge.generateMessageId(), humanChatRoomId, evanPlayerId, {message: 'zeds rule!'});
    this.addMessageToChatRoom(Bridge.generateMessageId(), humanChatRoomId, kimPlayerId, {message: 'hoomans drool!'});
    this.addMessageToChatRoom(Bridge.generateMessageId(), humanChatRoomId, kimPlayerId, {message: 'monkeys eat stool!'});
    var firstMissionId = Bridge.generateMissionId();
    this.addMission(firstMissionId, gameId, {beginTime: new Date().getTime() / 1000 - 10, endTime: new Date().getTime() / 1000 + 60 * 60, name: "first mission!", url: "/firstgame/missions/first-mission.html", allegianceFilter: 'resistance'});
    var rewardCategoryId = Bridge.generateRewardCategoryId();
    this.addRewardCategory(rewardCategoryId, gameId, {name: "signed up!", points: 2, seed: "derp"});
    this.addReward(Bridge.generateRewardId(), rewardCategoryId, {code: "flarklebark"});
    this.addReward(Bridge.generateRewardId(), rewardCategoryId, {code: "shooplewop"});
    this.addReward(Bridge.generateRewardId(), rewardCategoryId, {code: "lololol"});
    this.claimReward(evanPlayerId, "flarklebark");
    for (let i = 0; i < 80; i++) {
      this.addGun(Bridge.generateGunId(), {number: 1404 + i + ""});
    }
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
  signIn() {
    return this.database.get(["users"])[0] || null;
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
    let {name, rulesUrl, stunTimer} = args;
    this.database.push(["games"], {
      id: gameId,
      name: name,
      rulesUrl: rulesUrl,
      stunTimer: stunTimer,
      players: [],
      missions: [],
      chatRooms: [],
      notificationCategories: [],
      rewardCategories: [],
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
      id: Utils.generateId("userplayer"),
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
}