class User {
	constructor(userId, userEmail) {
	  this.id = userId || "";
    this.email = userEmail || "";
  }
}

class Game {
	constructor(gameId, adminUserId) {
    this.id = gameId || "";
    this.adminUserId = adminUserId || "";
	}
}

class Player {
	constructor(playerId, number, name, gameId, userId, preferences) {
		this.id = playerId || "";
    this.number = number || 0;
		this.name = name || "";
    this.gameId = gameId || "";
    this.userId = userId || "";
    this.points = 0;
    this.profileImageUrl = "";
    this.preferences = Utils.copyOf(preferences) || {};
    this.infections = [];
    this.lives = [];
	}
}

class ChatRoom {
	constructor(chatRoomId) {
	  this.id = chatRoomId;
    this.playerIds = [];
    this.messages = [];
  }
}

class Message {
	constructor(time, playerId, message) {
    // The server adds an 'id' field for the client code, but that shouldn't 
    // be stored in the database so is not present in this constructor
    this.time = time;
    this.playerId = playerId;
    this.message = message;
	}
}

class Mission {
  constructor(missionId, gameId, beginTime, endTime, name, url) {
    this.id = missionId;
    this.gameId = gameId;
    this.beginTime = beginTime;
    this.endTime = endTime;
    this.name = name;
    this.url = url;
  }
}

class RewardCategory {
  constructor(rewardCategoryId, gameId, name, points, seed) {
    this.id = rewardCategoryId;
    this.gameId = gameId;
    this.name = name;
    this.points = points;
    this.seed = seed;
  }
}

class Reward {
  constructor(rewardId, rewardCategoryId, rewardCode) {
    this.id = rewardId;
    this.rewardCategoryId = rewardCategoryId;
    this.rewardCode = rewardCode;
    this.playerIdOrNull = null;
  }
}

class Gun {
  constructor(gunId, gunNumber) {
    this.id = gunId;
    this.gunNumber = gunNumber;
    this.playerIdOrNull = null;
  }
}

class FakeDatabase {
	 constructor() {
    this.usersById = new Map();
    this.gamesById = new Map();
    this.playersById = new Map();
    this.chatRoomsById = new Map();
    this.missionsById = new Map();
    this.rewardsById = new Map();
    this.rewardCategoriesById = new Map();
    this.gunsById = new Map();
  }
  
  createUser(user) {
  	this.expectUserNotExists_(user.id);
  	this.usersById.set(user.id, Utils.copyOf(user));
  }
  getUserById(userId) {
  	this.expectUserExists_(userId);
  	return Utils.copyOf(this.usersById.get(userId));
  }
  createGame(game) {
    this.expectGameNotExists_(game.id);
    this.expectUserExists_(game.adminUserId);
    this.gamesById.set(game.id, Utils.copyOf(game));
  }
  getGameById(gameId) {
    this.expectGameExists_(gameId);
    return Utils.copyOf(this.gamesById.get(gameId));
  }
  createPlayer(player) {
    this.expectUserExists_(player.userId);
    this.expectGameExists_(player.gameId);
    this.expectPlayerNotExists_(player.id);
    this.playersById.set(player.id, Utils.copyOf(player));
  }
  setPlayerProfileImageUrl(playerId, imageUrl) {
    this.expectPlayerExists_(playerId);
    var player = this.playersById.get(playerId);
    player.profileImageUrl = imageUrl;
    this.playersById.set(player.id, Utils.copyOf(player));
  }
  getPlayerById(playerId) {
    this.expectPlayerExists_(playerId);
    return Utils.copyOf(this.playersById.get(playerId));
  }
  findAllPlayerIdsForGameId(gameId) {
    this.expectGameExists_(gameId);
    var result = [];
    for (var [playerId, player] of this.playersById) {
      if (this.playersById.get(playerId).gameId == gameId) {
        result.push(playerId);
      }
    }
    return Utils.copyOf(result);
  }
  findAllPlayerIdsForUserId(userId) {
    this.expectUserExists_(userId);
    var result = [];
    for (let [playerId, player] of this.playersById) {
      if (player.userId == userId) {
        result.push(playerId);
      }
    }
    return Utils.copyOf(result);
  }
  findPlayerIdByGameAndName(gameId, name) {
    this.expectGameExists_(gameId);
    var result = [];
    for (let [playerId, player] in this.playersById) {
      if (player.gameId == gameId && player.name == name) {
        result.push(player.id);
      }
    }
    return Utils.copyOf(result);
  }
  awardPoints(playerId, points) {
    this.expectPlayerExists_(playerId);
    var player = this.playersById.get(playerId);
    player.points += points;
    this.playersById.set(player.id, Utils.copyOf(player));
  }
  createChatRoom(chatRoom, firstPlayerId) {
    this.expectChatRoomNotExists_(chatRoom.id);
    this.expectPlayerExists_(firstPlayerId);
    this.chatRoomsById.set(chatRoom.id, Utils.copyOf(chatRoom));
    this.addPlayerToChatRoom(chatRoom.id, firstPlayerId);
  }
  findMessagesForChatRoom(chatRoomId) {
    this.expectChatRoomExists_(chatRoomId);
    return Utils.copyOf(this.chatRoomsById.get(chatRoomId).messages);
  }
  getChatRoomById(chatRoomId) {
    this.expectChatRoomExists_(chatRoomId);
    return Utils.copyOf(this.chatRoomsById.get(chatRoomId));
  }
  addMessageToChatRoom(chatRoomId, playerId, message, time) {
    this.expectChatRoomExists_(chatRoomId);
    this.expectPlayerExists_(playerId);
    this.chatRoomsById.get(chatRoomId).messages.push(
    	new Message(time, playerId, message));
  }
  addPlayerToChatRoom(chatRoomId, playerId) {
    this.expectChatRoomExists_(chatRoomId);
    this.expectPlayerExists_(playerId);
    if (this.chatRoomsById.get(chatRoomId).playerIds.indexOf(playerId) >= 0) {
      throwError('Player already in chat room');
    }
    this.chatRoomsById.get(chatRoomId).playerIds.push(playerId);
  }
  findAllChatRoomIdsForPlayerId(playerId) {
    this.expectPlayerExists_(playerId);
    var result = [];
    for (var [chatRoomId, chatRoom] of this.chatRoomsById) {
      if (chatRoom.playerIds.indexOf(playerId) >= 0) {
        result.push(chatRoomId);
      }
    }
    return Utils.copyOf(result);
  }
  findAllPlayerIdsForChatRoomId(chatRoomId) {
    this.expectChatRoomExists_(chatRoomId);
    return Utils.copyOf(this.chatRoomsById.get(chatRoomId).playerIds);
  }
  addMission(mission) {
    this.expectGameExists_(mission.gameId);
    this.expectMissionNotExists_(mission.id);
    this.missionsById.set(mission.id, Utils.copyOf(mission));
  }
  getMissionById(missionId) {
    this.expectMissionExists_(missionId);
    return Utils.copyOf(this.missionsById.get(missionId));
  }
  findAllMissionIdsForGameId(gameId) {
    let result = [];
    for (let [missionId, mission] of this.missionsById) {
      if (mission.gameId == gameId) {
        result.push(mission.id);
      }
    }
    return result;
  }
  addInfection(infecteePlayerId, infectorPlayerId, time) {
    this.expectPlayerExists_(infecteePlayerId);
    this.expectPlayerExists_(infectorPlayerId);
    let player = this.playersById.get(infecteePlayerId);
    player.infections.push({
      infectorPlayerId: infectorPlayerId,
      time: time,
    });
  }
  addLife(playerId, lifeCode, time) {
    this.expectPlayerExists_(playerId);
    let player = this.playersById.get(playerId);
    player.lives.push({
      time: time,
      lifeCode: lifeCode,
    });
  }
  addRewardCategory(rewardCategoryId, gameId, name, points, seed) {
    this.expectRewardCategoryNotExists_(rewardCategoryId);
    let category = new RewardCategory(rewardCategoryId, gameId, name, points, seed);
    this.rewardCategoriesById.set(rewardCategoryId, category);
  }
  findRewardCategoryIdsForGameId(gameId) {
    let result = [];
    for (const [rewardCategoryId, rewardCategory] of this.rewardCategoriesById) {
      if (rewardCategory.gameId == gameId) {
        result.push(rewardCategoryId);
      }
    }
    return result;
  }
  getRewardCategoryById(rewardCategoryId) {
    this.expectRewardCategoryExists_(rewardCategoryId);
    return Utils.copyOf(this.rewardCategoriesById.get(rewardCategoryId));
  }
  addReward(rewardId, rewardCategoryId, rewardCode) {
    this.expectRewardCategoryExists_(rewardCategoryId);
    this.expectRewardNotExists_(rewardId);
    let reward = new Reward(rewardId, rewardCategoryId, rewardCode);
    this.rewardsById.set(rewardId, reward);
  }
  findRewardIdOrNullByGameIdAndRewardCode(gameId, rewardCode) {
    for (const [rewardId, reward] of this.rewardsById) {
      if (this.getRewardCategoryById(reward.rewardCategoryId).gameId == gameId &&
          reward.rewardCode == rewardCode) {
        return rewardId;
      }
    }
    return null;
  }
  claimReward(playerId, rewardId) {
    this.expectPlayerExists_(playerId);
    this.expectRewardExists_(rewardId);
    let reward = this.rewardsById.get(rewardId);
    assert(reward.playerIdOrNull == null, 'Reward already claimed!');
    reward.playerIdOrNull = playerId;
  }
  getRewardById(rewardId) {
    this.expectRewardExists_(rewardId);
    return Utils.copyOf(this.rewardsById.get(rewardId));
  }
  findRewardIdsForPlayerId(playerId) {
    this.expectPlayerExists_(playerId);
    let result = [];
    for (const [rewardId, reward] of this.rewardsById) {
      if (reward.playerIdOrNull == playerId) {
        result.push(rewardId);
      }
    }
    return result;
  }
  findRewardIdsForRewardCategoryId(rewardCategoryId) {
    this.expectRewardCategoryExists_(rewardCategoryId);
    let result = [];
    for (const [rewardId, reward] of this.rewardsById) {
      if (reward.rewardCategoryId == rewardCategoryId) {
        result.push(rewardId);
      }
    }
    return result;
  }
  findRewardCategoryIdsForPlayerId(playerId) {
    this.expectPlayerExists_(playerId);
    return this.findRewardIdsForPlayerId(playerId)
        .map(rewardId => this.getRewardById(rewardId).rewardCategoryId);
  }
  setRewardCategoryName(rewardCategoryId, newName) {
    this.expectRewardCategoryExists_(rewardCategoryId);
    this.rewardCategoriesById.get(rewardCategoryId).name = newName;
  }

  getAllGunIds() {
    var result = [];
    for (let key of this.gunsById.keys())
      result.push(key);
    return result;
  }
  addGun(gunId, gunNumber) {
    this.expectGunNotExists_(gunId);
    var gun = new Gun(gunId, gunNumber);
    this.gunsById.set(gunId, gun);
  }
  setGunPlayer(gunId, playerIdOrNull) {
    this.expectGunExists_(gunId);
    if (playerIdOrNull)
      this.expectPlayerExists_(playerIdOrNull);
    this.gunsById.get(gunId).playerIdOrNull = playerIdOrNull;
  }
  returnGun(gunId) {
    this.expectGunExists_(gunId);
    this.gunsById.get(gunId).playerIdOrNull = null;
  }
  getGunById(gunId) {
    this.expectGunExists_(gunId);
    return this.gunsById.get(gunId);
  }
  findGunIdOrNullByNumber(gunNumber) {
    for (let [gunId, gun] of this.gunsById) {
      if (gun.number == gunNumber) {
        return gunId;
      }
    }
    return null;
  }
  findPlayerIdOrNullByLifeCode(gameId, lifeCode) {
    this.expectGameExists_(gameId);
    for (var [playerId, player] of this.playersById) {
      if (player.gameId == gameId) {
        const currentLife = player.lives[player.lives.length - 1];
        if (currentLife.lifeCode == lifeCode) {
          return playerId;
        }
      }
    }
    return null;
  }

  expectUserExists_(id) { assert(id && this.usersById.has(id), 'User id doesnt exist: ' + id); }
  expectUserNotExists_(id) { assert(id && !this.usersById.has(id), 'User id already taken: ' + id); }
  expectGameExists_(id) { assert(id && this.gamesById.has(id), 'Game id doesnt exist: ' + id); }
  expectGameNotExists_(id) { assert(id && !this.gamesById.has(id), 'Game id already taken: ' + id); }
  expectPlayerExists_(id) { assert(id && this.playersById.has(id), 'Player id doesnt exist: ' + id); }
  expectPlayerNotExists_(id) { assert(id && !this.playersById.has(id), 'Player id already taken: ' + id); }
  expectChatRoomExists_(id) { assert(id && this.chatRoomsById.has(id), 'ChatRoom id doesnt exist: ' + id); }
  expectChatRoomNotExists_(id) { assert(id && !this.chatRoomsById.has(id), 'ChatRoom id already taken: ' + id); }
  expectMissionExists_(id) { assert(id && this.missionsById.has(id), 'Mission id doesnt exist: ' + id); }
  expectMissionNotExists_(id) { assert(id && !this.missionsById.has(id), 'Mission id already taken: ' + id); }
  expectRewardCategoryExists_(id) { assert(id && this.rewardCategoriesById.has(id), 'RewardCategory id doesnt exist: ' + id); }
  expectRewardCategoryNotExists_(id) { assert(id && !this.rewardCategoriesById.has(id), 'RewardCategory id already taken: ' + id); }
  expectRewardExists_(id) { assert(id && this.rewardsById.has(id), 'Reward id doesnt exist: ' + id); }
  expectRewardNotExists_(id) { assert(id && !this.rewardsById.has(id), 'Reward id already taken: ' + id); }
  expectGunExists_(id) { assert(id && this.gunsById.has(id), 'Gun id doesnt exist: ' + id); }
  expectGunNotExists_(id) { assert(id && !this.gunsById.has(id), 'Gun id already taken: ' + id); }
}

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    debugger;
    throw message;
  }
}
