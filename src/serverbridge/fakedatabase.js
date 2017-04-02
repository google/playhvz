class User {
	constructor(userId, userEmail) {
	  this.userId = userId || "";
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
    this.profilePic = 'https://goo.gl/photos/iDXDUt1AtWeECXYa8'
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
  constructor(missionId, gameId, beginTime, endTime, url) {
    this.missionId = missionId;
    this.gameId = gameId;
    this.beginTime = beginTime;
    this.endTime = endTime;
    this.url = url;
  }
}

class FakeDatabase {
	 constructor() {
    this.usersById = new Map();
    this.gamesById = new Map();
    this.playersById = new Map();
    this.chatRoomsById = new Map();
    this.missionsById = new Map();
  }
  
  createUser(user) {
  	this.expectUserNotExists_(user.userId);
  	this.usersById.set(user.userId, Utils.copyOf(user));
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
      this.throwError('Player already in chat room');
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
    this.expectMissionNotExists_(mission.missionId);
    this.missionsById.set(mission.missionId, Utils.copyOf(mission));
  }
  getMissionById(missionId) {
    this.expectMissionExists_(missionId);
    return Utils.copyOf(this.missionsById.get(missionId));
  }
  findAllMissionIdsForGameId(gameId) {
    let result = [];
    for (let [missionId, mission] of this.missionsById) {
      if (mission.gameId == gameId) {
        result.push(mission.missionId);
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

  expectUserExists_(userId) {
    if (!this.usersById.has(userId))
      this.throwError('User id doesnt exist: ' + userId);
  }
  expectUserNotExists_(userId) {
    if (this.usersById.has(userId))
      this.throwError('User id already taken: ' + userId);
  }
  expectGameExists_(gameId) {
    if (!this.gamesById.has(gameId))
      this.throwError('Game id doesnt exist: ' + gameId);
  }
  expectGameNotExists_(gameId) {
    if (this.gamesById.has(gameId))
      this.throwError('Game id already taken: ' + gameId);
  }
  expectPlayerExists_(playerId) {
    if (!this.playersById.has(playerId))
      this.throwError('Player id doesnt exist: ' + playerId);
  }
  expectPlayerNotExists_(playerId) {
    if (this.playersById.has(playerId))
      this.throwError('Player id already taken: ' + playerId);
  }
  expectChatRoomExists_(chatRoomId) {
    if (!this.chatRoomsById.has(chatRoomId))
      this.throwError('Chat room id doesnt exist: ' + chatRoomId);
  }
  expectChatRoomNotExists_(chatRoomId) {
    if (this.chatRoomsById.has(chatRoomId))
      this.throwError('Chat room id already taken: ' + chatRoomId);
  }
  expectMissionExists_(missionId) {
    if (!this.missionsById.has(missionId))
      this.throwError('Mission id doesnt exist: ' + missionId);
  }
  expectMissionNotExists_(missionId) {
    if (this.missionsById.has(missionId))
      this.throwError('Mission id already taken: ' + missionId);
  }

  throwError(message) {
    console.error(message);
    debugger;
    throw message;
  }
}