'use strict';

class Bridge { }
Bridge.generateUserId = () => Utils.generateId("user");
Bridge.generateGameId = () => Utils.generateId("game");
Bridge.generatePlayerId = () => Utils.generateId("player");
Bridge.generateMissionId = () => Utils.generateId("mission");
Bridge.generateGunId = () => Utils.generateId("gun");
Bridge.generateChatRoomId = () => Utils.generateId("chatRoom");
Bridge.generateMessageId = () => Utils.generateId("message");
Bridge.generateNotificationCategoryId = () => Utils.generateId("notificationCategory");
Bridge.generateNotificationId = () => Utils.generateId("notification");
Bridge.generateRewardCategoryId = () => Utils.generateId("rewardCategory");
Bridge.generateRewardId = () => Utils.generateId("reward");
Bridge.generateMembershipId = () => Utils.generateId("membership");
Bridge.generatePlayerRewardId = () => Utils.generateId("playerReward");

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
  'signIn',
  'register',
  'createGame',
  'joinGame',
  'updatePlayer',
  'createChatRoom',
  'awardPoints',
  'addMessageToChatRoom',
  'addPlayerToChatRoom',
  'addMission',
  'infect',
  'revive',
  'addRewardCategory',
  'addReward',
  'addRewards',
  'claimReward',
  'updateRewardCategory',
  'addGun',
  'setGunPlayer',
  'updateMission',
];
