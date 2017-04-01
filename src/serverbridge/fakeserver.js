'use strict';

class FakeServer {
  constructor(requestContext, ) {
    this.fakeDatabase = new FakeDatabase();
    this.chatRoomsById = {};
  }
  
  register(requestContext, userId, userEmail) {
    var user = new User(userId, userEmail);
    this.fakeDatabase.createUser(user);
  }
  getUserById(requestContext, userId) {
    if (requestContext.loggedInUserId != userId) {
      throw "Permission denied: can't access other users.";
    }
    return this.fakeDatabase.getUserById(userId);
  }
  createGame(requestContext, gameId, adminUserId) {
    var game = new Game(gameId, adminUserId);
    this.fakeDatabase.createGame(game);
  }
  getGameById(requestContext, gameId) {
    return this.gamesById[gameId];
  }
  joinGame(requestContext, userId, gameId, playerId, name, preferences) {
    var player = new Player(playerId, name, gameId, userId);
    player.preferences = Utils.copyOf(preferences);
    this.fakeDatabase.createPlayer(player);
  }
  getPlayerById(requestContext, playerId) {
    return this.fakeDatabase.getPlayerById(playerId);
  }
  getMultiplePlayersById(requestContext, playerIds) {
    var value = {};
    for (var index in playerIds) {
      var playerId = playerIds[index];
      value[playerId] = this.fakeDatabase.getPlayerById(playerId);
    }
    return Utils.copyOf(value);
  }
  findAllPlayersForGameId(requestContext, gameId) {
    return this.fakeDatabase.findAllPlayersForGameId(gameId);
  }
  findAllPlayerIdsForUserId(requestContext, userId) {
    return this.fakeDatabase.findAllPlayerIdsForUserId(userId);
  }
  findPlayerIdByGameAndName(requestContext, gameId, name) {
    this.fakeDatabase.findPlayerIdByGameAndName(gameId, name);
  }
  createChatRoom(requestContext, chatRoomId, firstPlayerId) {
    var chatRoom = new ChatRoom(chatRoomId);
    this.fakeDatabase.createChatRoom(chatRoom, firstPlayerId);
  }
  /*
  * Returns all messages after the given id, not including the given id.
  * To get all messages, set afterId to -1.
  */
  findMessagesForChatRoom(requestContext, chatRoomId, afterId) {
    var messages = this.fakeDatabase.findMessagesForChatRoom(chatRoomId);
    var results = [];
    var startIndex = afterId < 0 ? 0 : afterId + 1;
    for (var i = startIndex; i < messages.length; i++) {
      var message = messages[i];
      message.id = i;
      results.push(message);
    }
    return results;
  }
  getChatRoomById(requestContext, chatRoomId) {
    var chatRoom = this.fakeDatabase.getChatRoomById(chatRoomId);
    for (var i = 0; i < chatRoom.messages.length; i++) {
      chatRoom.messages[i].id = i;
    }
    return chatRoom;
  }
  addMessageToChatRoom(requestContext, chatRoomId, playerId, message) {
    return this.fakeDatabase.addMessageToChatRoom(chatRoomId, playerId, message);
  }
  addPlayerToChatRoom(requestContext, chatRoomId, playerId) {
    return this.fakeDatabase.addPlayerToChatRoom(chatRoomId, playerId);
  }
  findAllChatRoomIdsForPlayerId(requestContext, playerId) {
    return this.fakeDatabase.findAllChatRoomIdsForPlayerId(playerId);
  }
  addMission(requestContext, gameId, missionId, beginTime, endTime, url) {
    var mission = new Mission(missionId, gameId, beginTime, endTime, url);
    return this.fakeDatabase.addMission(mission);
  }
  getMissionById(requestContext, missionId) {
    return Utils.copyOf(this.fakeDatabase.getMissionById(missionId));
  }
  findAllMissionIdsForGameId(requestContext, gameId) {
    return this.fakeDatabase.findAllMissionIdsForGameId(gameId);
  }
  findAllMissionsForPlayerId(requestContext, playerId) {
    var gameId = this.getPlayerById(playerId).gameId;
    var missionIds = this.findAllMissionIdsForGameId(gameId);
    var missions = [];
    for (const missionId of missionIds) {
      missions.push(this.getMissionById(missionId));
    }
    return missions;
  }
}



//   infectPlayer(requestContext, killerId, victimId) {
//     this.infections.push({
//       time: new Date().getTime(),
//       killerId: killerId,
//       victimId: victimId,
//     });
//   }
//   revivePlayer(requestContext, playerId) {
//     assert(requestContext, playerId in this.playersById);
//     var player = this.playersById[playerId];
//     player.revives.push({
//       time: new Date().getTime(),
//     });
//   }
//   addGun(requestContext, gunId) {
//     assert(requestContext, !(gunId in this.gunsById));
//     this.gunsById[gunId] = {
//       id: gunId,
//       playerId: null,
//     };
//   }
//   lendGun(requestContext, gunId, playerId) {
//     assert(requestContext, gunId in this.gunsById);
//     assert(requestContext, playerId in this.playersById);
//     var gun = this.gunsById[gunId];
//     assert(requestContext, gun.playerId == null);
//     gun.playerId = playerId;
//   }
//   transferGun(requestContext, gunId, fromplayerId, toplayerId) {
//     assert(requestContext, gunId in this.gunsById);
//     assert(requestContext, fromplayerId in this.playersById);
//     assert(requestContext, toplayerId in this.playersById);
//     var gun = this.gunsById[gunId];
//     assert(requestContext, gun.playerId == fromplayerId);
//     gun.playerId = toplayerId;
//   }
//   returnGun(requestContext, gunId, playerId) {
//     assert(requestContext, gunId in this.gunsById);
//     assert(requestContext, playerId in this.playersById);
//     var gun = this.gunsById[gunId];
//     assert(requestContext, gun.playerId == fromplayerId);
//     gun.playerId = null;
//   }
// }
