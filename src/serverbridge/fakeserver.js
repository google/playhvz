'use strict';

class FakeServer {
  constructor() {
    this.fakeDatabase = new FakeDatabase();
    this.chatRoomsById = {};
  }
  
  register(userId, userEmail) {
    var user = new User(userId, userEmail);
    this.fakeDatabase.createUser(user);
  }
  getUserById(userId) {
    return this.fakeDatabase.getUserById(userId);
  }
  createGame(gameId, adminUserId) {
    var game = new Game(gameId, adminUserId);
    this.fakeDatabase.createGame(game);
  }
  getGameById(gameId) {
    return this.gamesById[gameId];
  }
  joinGame(userId, gameId, playerId, name, preferences) {
    const numExistingPlayers = this.findAllPlayersForGameId(gameId).length;
    // First player will be number 1
    const number = 1 + numExistingPlayers;
    var player = new Player(playerId, number, name, gameId, userId);
    player.preferences = Utils.copyOf(preferences);
    this.fakeDatabase.createPlayer(player);

    this.fakeDatabase.addLife(playerId, this.generateLifeCode_(player), new Date().getTime());
  }
  getPlayerById(playerId) {
    let player = this.fakeDatabase.getPlayerById(playerId);
    player.species = this.isHuman_(player) ? 'human' : 'zombie';
    return player;
  }
  getMultiplePlayersById(playerIds) {
    var value = {};
    for (var index in playerIds) {
      var playerId = playerIds[index];
      value[playerId] = this.fakeDatabase.getPlayerById(playerId);
    }
    return Utils.copyOf(value);
  }
  findAllPlayersForGameId(gameId) {
    return this.fakeDatabase.findAllPlayerIdsForGameId(gameId)
        .map((playerId) => this.getPlayerById(playerId));
  }
  findAllPlayerIdsForUserId(userId) {
    return this.fakeDatabase.findAllPlayerIdsForUserId(userId);
  }
  findPlayerIdByGameAndName(gameId, name) {
    this.fakeDatabase.findPlayerIdByGameAndName(gameId, name);
  }
  createChatRoom(chatRoomId, firstPlayerId) {
    var chatRoom = new ChatRoom(chatRoomId);
    this.fakeDatabase.createChatRoom(chatRoom, firstPlayerId);
  }
  /*
  * Returns all messages after the given id, not including the given id.
  * To get all messages, set afterId to -1.
  */
  findMessagesForChatRoom(chatRoomId, afterId) {
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
  getChatRoomById(chatRoomId) {
    var chatRoom = this.fakeDatabase.getChatRoomById(chatRoomId);
    for (var i = 0; i < chatRoom.messages.length; i++) {
      chatRoom.messages[i].id = i;
    }
    return chatRoom;
  }
  addMessageToChatRoom(chatRoomId, playerId, message) {
    return this.fakeDatabase.addMessageToChatRoom(chatRoomId, playerId, message, new Date().getTime());
  }
  addPlayerToChatRoom(chatRoomId, playerId) {
    return this.fakeDatabase.addPlayerToChatRoom(chatRoomId, playerId);
  }
  findAllChatRoomIdsForPlayerId(playerId) {
    return this.fakeDatabase.findAllChatRoomIdsForPlayerId(playerId);
  }
  addMission(gameId, missionId, beginTime, endTime, url) {
    var mission = new Mission(missionId, gameId, beginTime, endTime, url);
    return this.fakeDatabase.addMission(mission);
  }
  getMissionById(missionId) {
    return Utils.copyOf(this.fakeDatabase.getMissionById(missionId));
  }
  findAllMissionIdsForGameId(gameId) {
    return this.fakeDatabase.findAllMissionIdsForGameId(gameId);
  }
  findAllMissionsForPlayerId(playerId) {
    var gameId = this.getPlayerById(playerId).gameId;
    var missionIds = this.findAllMissionIdsForGameId(gameId);
    var missions = [];
    for (const missionId of missionIds) {
      missions.push(this.getMissionById(missionId));
    }
    return missions;
  }
  infect(infectorPlayerId, infecteePlayerId, infecteeLifeCode) {
    const infectee = this.getPlayerById(infecteePlayerId);
    if (!this.isHuman_(infectee)) {
      throw 'Cannot infect, infectee is not human!';
    }
    const currentLife = infectee.lives[infectee.lives.length - 1];
    if (currentLife.lifeCode != infecteeLifeCode) {
      throw 'Cannot infect, incorrect life code!';
    }
    this.fakeDatabase.addInfection(infecteePlayerId, infectorPlayerId, new Date().getTime());
  }
  revive(playerId) {
    let player = this.fakeDatabase.getPlayerById(playerId);
    const newLifeCode = this.generateLifeCode_(player)
    this.fakeDatabase.addLife(playerId, newLifeCode, new Date().getTime());
  }
  isHuman_(player) {
    return player.lives.length > player.infections.length;
  }
  generateLifeCode_(player) {
    return 'lifecode-' + player.number + '-' + (player.lives.length + 1);
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
