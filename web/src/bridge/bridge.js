'use strict';

class Bridge { }
Bridge.generateUserId = () => Utils.generateId("user");
Bridge.generateGameId = () => Utils.generateId("game");
Bridge.generatePlayerId = () => Utils.generateId("player");
Bridge.generateLifeId = () => Utils.generateId("life");
Bridge.generateAdminId = () => Utils.generateId("admin");
Bridge.generateInfectionId = () => Utils.generateId("infection");
Bridge.generateMissionId = () => Utils.generateId("mission");
Bridge.generateGunId = () => Utils.generateId("gun");
Bridge.generateChatRoomId = () => Utils.generateId("chatRoom");
Bridge.generateMessageId = () => Utils.generateId("message");
Bridge.generateNotificationCategoryId = () => Utils.generateId("notificationCategory");
Bridge.generateNotificationId = () => Utils.generateId("notification");
Bridge.generateRewardCategoryId = () => Utils.generateId("rewardCategory");
Bridge.generateRewardId = () => Utils.generateId("reward");
Bridge.generateMembershipId = () => Utils.generateId("membership");
Bridge.generateClaimId = () => Utils.generateId("claim");
Bridge.generateQuizQuestionId = () => Utils.generateId("quizQuestion");
Bridge.generateQuizAnswerId = () => Utils.generateId("quizAnswer");

const SERVER_PLAYER_PROPERTIES = ["name", "needGun", "profileImageUrl", "startAsZombie", "volunteer", "beSecretZombie"];
const SERVER_QUIZ_QUESTION_PROPERTIES = ["text", "type"];
const SERVER_QUIZ_ANSWER_PROPERTIES = ["text", "order", "isCorrect"];
const SERVER_GAME_PROPERTIES = ["name", "rulesUrl", "stunTimer"];
const SERVER_USER_PROPERTIES = [];
const SERVER_CHAT_ROOM_PROPERTIES = ["name", "allegianceFilter"];
const SERVER_MESSAGE_PROPERTIES = ["message"];
const SERVER_MISSION_PROPERTIES = ["beginTime", "endTime", "name", "url", "allegianceFilter"];
const SERVER_REWARD_CATEGORY_PROPERTIES = ["name", "points", "seed"];
const SERVER_REWARD_PROPERTIES = [];
const SERVER_GUN_PROPERTIES = [];
const SERVER_NOTIFICATION_CATEGORY_PROPERTIES = ["name", "message", "previewMessage", "sendTime", "allegianceFilter", "email", "app", "sound", "vibrate", "destination", "icon"];
const SERVER_NOTIFICATION_PROPERTIES = ["message", "previewMessage", "sound", "vibrate", "app", "email", "destination"];

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
  'removePlayerFromChatRoom',
  'addQuizQuestion',
  'addQuizAnswer',
  'addMission',
  'infect',
  'addLife',
  'addRewardCategory',
  'addReward',
  'addRewards',
  'claimReward',
  'updateRewardCategory',
  'addGun',
  'setGunPlayer',
  'updateMission',
  'addNotificationCategory',
  'updateNotificationCategory',
  'markNotificationSeen',
];
