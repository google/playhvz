'use strict';

// logIn(authcode)
// register(userId, userEmail)
// getUserById(userId)
// createGame(gameId, adminUserId)
// getGameById(gameId)
// joinGame(userId, gameId, playerId, name)
// findAllPlayerIdsForGameId(gameId)
// findAllPlayerIdsForUserId(userId)
// findPlayerByGameAndName(gameId, name)
// createChatRoom(chatRoomId, firstPlayerId)
// findMessagesForChatRoom(chatRoomId, afterTime)
// getChatRoomById(chatRoomId)
// addMessageToChatRoom(chatRoomId, playerId, message)
// addPlayerToChatRoom(chatRoomId, playerId)
// findAllChatRoomIdsForPlayer(playerId)
// addMission(gameId, missionId, beginTime, endTime, url)

class ServerBridge {
  // also sends login link in email
  register(userId, userEmail) { console.log("Called abstract method!"); }
  // returns current-user-id
  logIn(authcode) { console.log("Called abstract method!"); }
  //
  createGame(gameId, adminUserId) { console.log("Called abstract method!"); }
  //
  joinGame(userId, gameId, playerId, name) { console.log("Called abstract method!"); }
  //
  getPlayerById(playerId) { console.log("Called abstract method!"); }
  //
  getUserById(userId) { console.log("Called abstract method!"); }
  // player contains name, icon, game id, user id, name
  findAllPlayerIdsForUserId(userId) { console.log("Called abstract method!"); }
  //
  getGameById(gameId) { console.log("Called abstract method!"); }
  //
  findAllPlayersForGameId(gameId) { console.log("Called abstract method!"); }
  //
  findAllPlayerIdsForGameId(gameId) { console.log("Called abstract method!"); }
  // only current player can see his or her chat rooms
  findAllChatRoomIdsForPlayer(playerId) { console.log("Called abstract method!"); }
  // case and whitespace dont matter
  findPlayerIdByGameAndName(gameId, name) { console.log("Called abstract method!"); }
  //
  createChatRoom(chatRoomId, firstPlayerId) { console.log("Called abstract method!"); }
  // contains list of players
  getChatRoomById(chatRoomId) { console.log("Called abstract method!"); }
  //
  addPlayerToChatRoom(chatRoomId, playerId) { console.log("Called abstract method!"); }
  //
  addMessageToChatRoom(chatRoomId, playerId, message) { console.log("Called abstract method!"); }
  //
  findMessagesForChatRoom(chatRoomId, afterTime) { console.log("Called abstract method!"); }
  // url is preferably relative like "/missions/first-mission.html"
  addMission(gameId, missionId, beginTime, endTime, url) { console.log("Called abstract method!"); }
  //
  findAllMissionsForPlayerId(playerId) { console.log("Called abstract method!"); }
}
