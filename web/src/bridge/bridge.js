'use strict';

// register(userId, userEmail)
// logIn(authcode)

// createGame(gameId, adminUserId)

// joinGame(userId, gameId, playerId, name)
// infect(infectorPlayerId, infecteePlayerId, infecteeLifeCode)
// revive(playerId)
// awardPoints(playerId, points)
// setPlayerProfileImageUrl(playerId, imageUrl)

// createChatRoom(chatRoomId, firstPlayerId)
// addMessageToChatRoom(chatRoomId, playerId, message)
// addPlayerToChatRoom(chatRoomId, playerId)

// addRewardCategory(rewardCategoryId, gameId, {name, points, seed})
// updateRewardCategory(rewardCategoryId, {name, points, seed})
// addRewards(rewardCategoryId, numNewRewards)

// addReward(rewardId, rewardCategoryId, rewardCode)
// claimReward(playerId, rewardCode)

// addGun(gunId, {number})
// setGunPlayer(gunId, playerIdOrNull)

// addMission(missionId, gameId, {beginTime, endTime, name, url})
// updateMission(missionId, {beginTime, endTime, name, url})

// addNotification(gameId, allegianceFilter, message, vibrate, sound)

//    getUserById(userId)
//    getGameById(gameId)
//    getPlayerById(playerId)
//    findAllPlayerIdsForGameId(gameId)
//    findAllPlayerIdsForUserId(userId)
//    findPlayerByGameAndName(gameId, name)
//    getMultiplePlayersById(playersIds)
//    findAllPlayersForGameId(playerId)
//    getChatRoomById(chatRoomId)
//    findMessagesForChatRoom(chatRoomId, afterTime)
//    findAllChatRoomIdsForPlayerId(playerId)
//    findRewardsForPlayerId(playerId)
//    findRewardsForRewardCategoryId(rewardCategoryId)
//    getGunById(gunId)
//    getAllGuns()
//    getAllMissions(gameId)
//    getMissionById(missionId)
//    findAllMissionsForPlayerId(playerId)
//    findAllNotificationsForPlayer


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
