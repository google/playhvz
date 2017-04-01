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
// findAllChatRoomIdsForPlayerId(playerId)
// addMission(gameId, missionId, beginTime, endTime, url)
// getPlayerById(playerId)
// findAllPlayersForGameId(playerId)
// findAllMissionsForPlayerId(playerId)
// getMultiplePlayersById(playersIds)

const SERVER_METHODS = [
  'logIn',
  'register',
  'getUserById',
  'createGame',
  'getGameById',
  'joinGame',
  'findAllPlayerIdsForGameId',
  'findAllPlayerIdsForUserId',
  'findPlayerByGameAndName',
  'createChatRoom',
  'awardPoints',
  'findMessagesForChatRoom',
  'getChatRoomById',
  'addMessageToChatRoom',
  'addPlayerToChatRoom',
  'findAllChatRoomIdsForPlayerId',
  'addMission',
  'getPlayerById',
  'findAllPlayersForGameId',
  'findAllMissionsForPlayerId',
  'getMultiplePlayersById',
];
