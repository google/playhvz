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

class FakeDatabase {
	 constructor() {
    this.usersById = {};
    this.gamesById = {};
    this.playersById = {};
    this.chatRoomsById = {};
  }
  
  createUser(user) {
  	this.expectUserNotExists_(user.userId);
  	this.usersById[user.userId] = Utils.copyOf(user);
  }
  getUserById(userId) {
  	this.expectUserExists_(userId);
  	return Utils.copyOf(this.usersById[userId]);
  }
  createGame(game) {
    this.expectGameNotExists_(game.id);
    this.expectUserExists_(game.adminUserId);
    this.gamesById[game.id] = Utils.copyOf(game);
  }
  getGameById(gameId) {
    this.expectGameExists_(gameId);
    return Utils.copyOf(this.gamesById[gameId]);
  }
  createPlayer(player) {
    this.expectUserExists_(player.userId);
    this.expectGameExists_(player.gameId);
    this.expectPlayerNotExists_(player.id);
    this.playersById[player.id] = Utils.copyOf(player);
  }
  getPlayerById(playerId) {
    this.expectPlayerExists_(playerId);
    return Utils.copyOf(this.playersById[playerId]);
  }
  findAllPlayersForGameId(gameId) {
    this.expectGameExists_(gameId);
    var result = [];
    for (var playerId in this.playersById) {
      if (this.playersById[playerId].gameId == gameId) {
        result.push(this.getPlayerById(playerId));
      }
    }
    return Utils.copyOf(result);
  }
  findAllPlayerIdsForUserId(userId) {
    this.expectUserExists_(userId);
    var result = [];
    for (var playerId in this.playersById) {
      if (this.playersById[playerId].userId == userId) {
        result.push(playerId);
      }
    }
    return Utils.copyOf(result);
  }
  findPlayerIdByGameAndName(gameId, name) {
    this.expectGameExists_(gameId);
    var result = [];
    for (var playerId in this.playersById) {
      var player = this.playersById[playerId];
      if (player.gameId == gameId && player.name == name) {
        result.push(player.id);
      }
    }
    return Utils.copyOf(result);
  }
  createChatRoom(chatRoom, firstPlayerId) {
    this.expectChatRoomNotExists_(chatRoom.id);
    this.expectPlayerExists_(firstPlayerId);
    this.chatRoomsById[chatRoom.id] = Utils.copyOf(chatRoom);
    this.addPlayerToChatRoom(chatRoom.id, firstPlayerId);
  }
  findMessagesForChatRoom(chatRoomId) {
    this.expectChatRoomExists_(chatRoomId);
    return Utils.copyOf(this.chatRoomsById[chatRoomId].messages);
  }
  getChatRoomById(chatRoomId) {
    this.expectChatRoomExists_(chatRoomId);
    return Utils.copyOf(this.chatRoomsById[chatRoomId]);
  }
  addMessageToChatRoom(chatRoomId, playerId, message) {
    this.expectChatRoomExists_(chatRoomId);
    this.expectPlayerExists_(playerId);
    this.chatRoomsById[chatRoomId].messages.push(
    	new Message(new Date().getTime(), playerId, message));
  }
  addPlayerToChatRoom(chatRoomId, playerId) {
    this.expectChatRoomExists_(chatRoomId);
    this.expectPlayerExists_(playerId);
    if (this.chatRoomsById[chatRoomId].playerIds.indexOf(playerId) >= 0) {
      throw 'Player already in chat room';
    }
    this.chatRoomsById[chatRoomId].playerIds.push(playerId);
  }
  findAllChatRoomIdsForPlayer(playerId) {
    this.expectPlayerExists_(playerId);
    var result = [];
    for (var chatRoomId in this.chatRoomsById) {
      var chatRoom = this.chatRoomsById[chatRoomId];
      if (chatRoom.playerIds.indexOf(playerId) >= 0) {
        result.push(chatRoomId);
      }
    }
    return Utils.copyOf(result);
  }


  expectUserExists_(userId) {
    if (!(userId in this.usersById))
      throw 'User id doesnt exist: ' + userId;
  }
  expectUserNotExists_(userId) {
    if (userId in this.usersById)
      throw 'User id already taken: ' + userId;
  }
  expectGameExists_(gameId) {
    if (!(gameId in this.gamesById))
      throw 'Game id doesnt exist: ' + gameId;
  }
  expectGameNotExists_(gameId) {
    if (gameId in this.gamesById)
      throw 'Game id already taken: ' + gameId;
  }
  expectPlayerExists_(playerId) {
    if (!(playerId in this.playersById))
      throw 'Player id doesnt exist: ' + playerId;
  }
  expectPlayerNotExists_(playerId) {
    if (playerId in this.playersById)
      throw 'Player id already taken: ' + playerId;
  }
  expectChatRoomExists_(chatRoomId) {
    if (!(chatRoomId in this.chatRoomsById))
      throw 'Chat room id doesnt exist: ' + chatRoomId;
  }
  expectChatRoomNotExists_(chatRoomId) {
    if (chatRoomId in this.chatRoomsById)
      throw 'Chat room id already taken: ' + chatRoomId;
  }
}