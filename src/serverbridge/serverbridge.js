'use strict';

// register(userId, userEmail)
// getUserById(userId)
// logIn(authcode)

// createGame(gameId, adminUserId)
// getGameById(gameId)

// joinGame(userId, gameId, playerId, name)
// getPlayerById(playerId)
// findAllPlayerIdsForGameId(gameId)
// findAllPlayerIdsForUserId(userId)
// findPlayerByGameAndName(gameId, name)
// getMultiplePlayersById(playersIds)
// findAllPlayersForGameId(playerId)
// infect(infectorPlayerId, infecteePlayerId, infecteeLifeCode)
// revive(playerId)
// awardPoints(playerId, points)
// setPlayerProfileImageUrl(playerId, imageUrl)

// createChatRoom(chatRoomId, firstPlayerId)
// getChatRoomById(chatRoomId)
// findMessagesForChatRoom(chatRoomId, afterTime)
// findAllChatRoomIdsForPlayerId(playerId)
// addMessageToChatRoom(chatRoomId, playerId, message)
// addPlayerToChatRoom(chatRoomId, playerId)

// addRewardCategory(rewardCategoryId, gameId, {name, points, seed})
// updateRewardCategory(rewardCategoryId, {name, points, seed})
// addRewards(rewardCategoryId, numNewRewards)

// addReward(rewardId, rewardCategoryId, rewardCode)
// findRewardsForPlayerId(playerId)
// findRewardsForRewardCategoryId(rewardCategoryId)
// claimReward(playerId, rewardCode)

// addGun(gunId, {number})
// getGunById(gunId)
// getAllGuns()
// setGunPlayer(gunId, playerIdOrNull)

// addMission(missionId, gameId, {beginTime, endTime, name, url})
// getAllMissions(gameId)
// updateMission(missionId, {beginTime, endTime, name, url})
// getMissionById(missionId)
// findAllMissionsForPlayerId(playerId)


const SERVER_METHODS = [
  'logIn',
  'register',
  'getUserById',
  'createGame',
  'getGameById',
  'joinGame',
  'setPlayerProfileImageUrl',
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
  'findAllPlayerIdsForChatRoomId',
  'addMission',
  'getPlayerById',
  'findAllPlayersForGameId',
  'findAllMissionsForPlayerId',
  'getMultiplePlayersById',
  'infect',
  'revive',
  'addRewardCategory',
  'addReward',
  'addRewards',
  'claimReward',
  'findRewardsForPlayerId',
  'getMissionById',
  'findRewardsForRewardCategoryId',
  'updateRewardCategory',
  'getAllGuns',
  'addGun',
  'setGunPlayer',
  'getGunById',
  'findAllMissionsForGameId',
  'updateMission',
];
