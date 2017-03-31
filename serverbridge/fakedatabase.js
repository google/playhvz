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
	constructor(playerId, name, gameId, userId, preferences) {
		this.id = playerId || "";
		this.name = name || "";
    this.gameId = gameId || "";
    this.userId = userId || "";
    this.preferences = Utils.copyOf(preferences) || {};
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
  findAllPlayersForGameId(gameId) {
    this.expectGameExists_(gameId);
    var result = [];
    for (var [playerId, player] of this.playersById) {
      if (this.playersById.get(playerId).gameId == gameId) {
        result.push(this.getPlayerById(playerId));
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
  addMessageToChatRoom(chatRoomId, playerId, message) {
    this.expectChatRoomExists_(chatRoomId);
    this.expectPlayerExists_(playerId);
    this.chatRoomsById.get(chatRoomId).messages.push(
    	new Message(new Date().getTime(), playerId, message));
  }
  addPlayerToChatRoom(chatRoomId, playerId) {
    this.expectChatRoomExists_(chatRoomId);
    this.expectPlayerExists_(playerId);
    if (this.chatRoomsById.get(chatRoomId).playerIds.indexOf(playerId) >= 0) {
      throw 'Player already in chat room';
    }
    this.chatRoomsById.get(chatRoomId).playerIds.push(playerId);
  }
  findAllChatRoomIdsForPlayer(playerId) {
    this.expectPlayerExists_(playerId);
    var result = [];
    for (var chatRoomId in this.chatRoomsById) {
      var chatRoom = this.chatRoomsById.get(chatRoomId);
      if (chatRoom.playerIds.indexOf(playerId) >= 0) {
        result.push(chatRoomId);
      }
    }
    return Utils.copyOf(result);
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


  expectUserExists_(userId) {
    if (!this.usersById.has(userId))
      throw 'User id doesnt exist: ' + userId;
  }
  expectUserNotExists_(userId) {
    if (this.usersById.has(userId))
      throw 'User id already taken: ' + userId;
  }
  expectGameExists_(gameId) {
    if (!this.gamesById.has(gameId))
      throw 'Game id doesnt exist: ' + gameId;
  }
  expectGameNotExists_(gameId) {
    if (this.gamesById.has(gameId))
      throw 'Game id already taken: ' + gameId;
  }
  expectPlayerExists_(playerId) {
    if (!this.playersById.has(playerId))
      throw 'Player id doesnt exist: ' + playerId;
  }
  expectPlayerNotExists_(playerId) {
    if (this.playersById.has(playerId))
      throw 'Player id already taken: ' + playerId;
  }
  expectChatRoomExists_(chatRoomId) {
    if (!this.chatRoomsById.has(chatRoomId))
      throw 'Chat room id doesnt exist: ' + chatRoomId;
  }
  expectChatRoomNotExists_(chatRoomId) {
    if (this.chatRoomsById.has(chatRoomId))
      throw 'Chat room id already taken: ' + chatRoomId;
  }
  expectMissionExists_(missionId) {
    if (!this.missionsById.has(missionId))
      throw 'Mission id doesnt exist: ' + missionId;
  }
  expectMissionNotExists_(missionId) {
    if (this.missionsById.has(missionId))
      throw 'Mission id already taken: ' + missionId;
  }
}