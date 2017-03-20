
class FakeServer {
  constructor() {
    this.usersById = {};
    this.gamesById = {};
    this.playersById = {};
    this.chatRoomsById = {};
  }
  
  register(userId, userEmail) {
    this.expectUserNotExists_(userId);
    this.usersById[userId] = {
      userId: userId,
      email: userEmail,
    };
  }
  getUserById(userId) {
    this.expectUserExists_(userId);
    var user = this.usersById[userId];
    return {
      id: user.id,
    };
  }
  createGame(gameId, adminUserId) {
    this.expectGameNotExists_(gameId);
    this.expectUserExists_(adminUserId);
    this.gamesById[gameId] = {
      id: gameId,
      adminUserId: adminUserId,
    };
  }
  getGameById(gameId) {
    this.expectGameExists_(gameId);
    return this.gamesById[gameId];
  }
  joinGame(userId, gameId, playerId, name) {
    this.expectUserExists_(userId);
    this.expectGameExists_(gameId);
    this.expectPlayerNotExists_(playerId);
    this.playersById[playerId] = {
      gameId: gameId,
      userId: userId,
      id: playerId,
      name: name,
    };
  }
  getPlayerById(playerId) {
    this.expectPlayerExists_(playerId);
    var player = this.playersById[playerId];
    return {
      id: player.id,
      name: player.name,
      gameId: player.gameId,
      userId: player.userId,
    };
  }
  findAllPlayersForGameId(gameId) {
    this.expectGameExists_(gameId);
    var result = [];
    for (var playerId in this.playersById) {
      if (this.playersById[playerId].gameId == gameId) {
        result.push(this.getPlayerById(playerId));
      }
    }
    return result;
  }
  findAllPlayerIdsForGameId(gameId) {
    this.expectGameExists_(gameId);
    var result = [];
    for (var playerId in this.playersById) {
      if (this.playersById[playerId].gameId == gameId) {
        result.push(playerId);
      }
    }
    return result;
  }
  findAllPlayerIdsForUserId(userId) {
    this.expectUserExists_(userId);
    var result = [];
    for (var playerId in this.playersById) {
      if (this.playersById[playerId].userId == userId) {
        result.push(playerId);
      }
    }
    return result;
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
    return result;
  }
  createChatRoom(chatRoomId, firstPlayerId) {
    this.expectChatRoomNotExists_(chatRoomId);
    this.expectPlayerExists_(firstPlayerId);
    this.chatRoomsById[chatRoomId] = {
      id: chatRoomId,
      playerIds: [],
      messages: [],
    };
    this.addPlayerToChatRoom(chatRoomId, firstPlayerId);
  }
  findMessagesForChatRoom(chatRoomId, afterTime) {
    this.expectChatRoomExists_(chatRoomId);
    var results = [];
    for (var chatRoomId in this.chatRoomsById) {
      var chatRoom = this.chatRoomsById[chatRoomId];
      for (var i = 0; i < chatRoom.messages.length; i++) {
        var message = chatRoom.messages[i];
        if (message.time > afterTime) {
          resuts.push(message);
        }
      }
    }
    return results;
  }
  getChatRoomById(chatRoomId) {
    this.expectChatRoomExists_(chatRoomId);
    return this.chatRoomsById[chatRoomId];
  }
  addMessageToChatRoom(chatRoomId, playerId, message) {
    this.expectChatRoomExists_(chatRoomId);
    this.expectPlayerExists_(playerId);
    this.chatRoomsById[chatRoomId].messages.push({
      time: new Date().getTime(),
      playerId: playerId,
      message: message,
    });
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
    return result;
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



//   infectPlayer(killerId, victimId) {
//     this.infections.push({
//       time: new Date().getTime(),
//       killerId: killerId,
//       victimId: victimId,
//     });
//   }
//   revivePlayer(playerId) {
//     assert(playerId in this.playersById);
//     var player = this.playersById[playerId];
//     player.revives.push({
//       time: new Date().getTime(),
//     });
//   }
//   addGun(gunId) {
//     assert(!(gunId in this.gunsById));
//     this.gunsById[gunId] = {
//       id: gunId,
//       playerId: null,
//     };
//   }
//   lendGun(gunId, playerId) {
//     assert(gunId in this.gunsById);
//     assert(playerId in this.playersById);
//     var gun = this.gunsById[gunId];
//     assert(gun.playerId == null);
//     gun.playerId = playerId;
//   }
//   transferGun(gunId, fromplayerId, toplayerId) {
//     assert(gunId in this.gunsById);
//     assert(fromplayerId in this.playersById);
//     assert(toplayerId in this.playersById);
//     var gun = this.gunsById[gunId];
//     assert(gun.playerId == fromplayerId);
//     gun.playerId = toplayerId;
//   }
//   returnGun(gunId, playerId) {
//     assert(gunId in this.gunsById);
//     assert(playerId in this.playersById);
//     var gun = this.gunsById[gunId];
//     assert(gun.playerId == fromplayerId);
//     gun.playerId = null;
//   }
// }
