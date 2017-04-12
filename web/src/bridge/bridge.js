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
