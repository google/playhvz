'use strict';

window.Model = (function() {

var Model = {};

const GUN_PROPERTIES = ["gameId", "playerId", "label"];
const GUN_COLLECTIONS = [];
Model.Gun = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, GUN_PROPERTIES);
  Utils.addEmptyLists(this, GUN_COLLECTIONS);
}

const USER_PROPERTIES = ["deviceToken"];
const USER_COLLECTIONS = ["players"];
Model.User = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, USER_PROPERTIES);
  Utils.addEmptyLists(this, USER_COLLECTIONS);
}

const USER_PLAYER_PROPERTIES = ["gameId", "userId"];
const USER_PLAYER_COLLECTIONS = [];
Model.UserPlayer = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, USER_PLAYER_PROPERTIES);
  Utils.addEmptyLists(this, USER_PLAYER_COLLECTIONS);
}

const GAME_PROPERTIES = ["active", "started", "name", "number", "rulesHtml", "faqHtml", "stunTimer", "adminContactPlayerId"];
const GAME_COLLECTIONS = ["guns", "missions", "rewardCategories", "chatRooms", "players", "admins", "queuedNotifications", "quizQuestions", "groups", "maps", "defaultProfileImages"];
Model.Game = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, GAME_PROPERTIES);
  Utils.addEmptyLists(this, GAME_COLLECTIONS);
}

const QUIZ_QUESTION_PROPERTIES = ["text", "type", "number"];
const QUIZ_QUESTION_COLLECTIONS = ["answers"];
Model.QuizQuestion = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, QUIZ_QUESTION_PROPERTIES);
  Utils.addEmptyLists(this, QUIZ_QUESTION_COLLECTIONS);
}

const QUIZ_ANSWER_PROPERTIES = ["text", "isCorrect", "order", "number"];
const QUIZ_ANSWER_COLLECTIONS = [];
Model.QuizAnswer = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, QUIZ_ANSWER_PROPERTIES);
  Utils.addEmptyLists(this, QUIZ_ANSWER_COLLECTIONS);
}

const GROUP_PROPERTIES = ["name", "gameId", "allegianceFilter", "autoAdd", "canAddOthers", "canRemoveOthers", "canAddSelf", "canRemoveSelf", "autoRemove", "ownerPlayerId"];
const GROUP_COLLECTIONS = ["memberships"];
Model.Group = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, GROUP_PROPERTIES);
  Utils.addEmptyLists(this, GROUP_COLLECTIONS);
}

const CHAT_ROOM_PROPERTIES = ["gameId", "name", "accessGroupId", "withAdmins"];
const CHAT_ROOM_COLLECTIONS = ["messages", "requestCategories"];
Model.ChatRoom = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, CHAT_ROOM_PROPERTIES);
  Utils.addEmptyLists(this, CHAT_ROOM_COLLECTIONS);
}

const MAP_PROPERTIES = ["gameId", "name", "groupId"];
const MAP_COLLECTIONS = ["markers"];
Model.Map = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, MAP_PROPERTIES);
  Utils.addEmptyLists(this, MAP_COLLECTIONS);
}

const MARKER_PROPERTIES = ["name", "color", "playerId", "latitude", "longitude"];
const MARKER_COLLECTIONS = [];
Model.Marker = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, MARKER_PROPERTIES);
  Utils.addEmptyLists(this, MARKER_COLLECTIONS);
}

const GROUP_MEMBERSHIP_PROPERTIES = ["playerId"];
const GROUP_MEMBERSHIP_COLLECTIONS = [];
Model.GroupMembership = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, GROUP_MEMBERSHIP_PROPERTIES);
  Utils.addEmptyLists(this, GROUP_MEMBERSHIP_COLLECTIONS);
}

const PLAYER_CHAT_ROOM_MEMBERSHIP_PROPERTIES = ["chatRoomId", "visible"];
const PLAYER_CHAT_ROOM_MEMBERSHIP_COLLECTIONS = [];
Model.PlayerChatRoomMembership = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, PLAYER_CHAT_ROOM_MEMBERSHIP_PROPERTIES);
  Utils.addEmptyLists(this, PLAYER_CHAT_ROOM_MEMBERSHIP_COLLECTIONS);
}

const PLAYER_MISSION_MEMBERSHIP_PROPERTIES = ["missionId"];
const PLAYER_MISSION_MEMBERSHIP_COLLECTIONS = [];
Model.PlayerMissionMembership = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, PLAYER_MISSION_MEMBERSHIP_PROPERTIES);
  Utils.addEmptyLists(this, PLAYER_MISSION_MEMBERSHIP_COLLECTIONS);
}

const PLAYER_GROUP_MEMBERSHIP_PROPERTIES = ["groupId"];
const PLAYER_GROUP_MEMBERSHIP_COLLECTIONS = [];
Model.PlayerGroupMembership = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, PLAYER_GROUP_MEMBERSHIP_PROPERTIES);
  Utils.addEmptyLists(this, PLAYER_GROUP_MEMBERSHIP_COLLECTIONS);
}

const MESSAGE_PROPERTIES = ["index", "message", "playerId", "time", "location"];
const MESSAGE_COLLECTIONS = [];
Model.Message = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, MESSAGE_PROPERTIES);
  Utils.addEmptyLists(this, MESSAGE_COLLECTIONS);
}

const REQUEST_CATEGORY_PROPERTIES = ["playerId", "time", "text", "type", "dismissed"];
const REQUEST_CATEGORY_COLLECTIONS = ["requests"];
Model.RequestCategory = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, REQUEST_CATEGORY_PROPERTIES);
  Utils.addEmptyLists(this, REQUEST_CATEGORY_COLLECTIONS);
}

const REQUEST_PROPERTIES = ["playerId", "response"];
const REQUEST_COLLECTIONS = [];
Model.Request = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, REQUEST_PROPERTIES);
  Utils.addEmptyLists(this, REQUEST_COLLECTIONS);
}

const RESPONSE_PROPERTIES = ["time", "text"];
const RESPONSE_COLLECTIONS = [];
Model.Response = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, RESPONSE_PROPERTIES);
  Utils.addEmptyLists(this, RESPONSE_COLLECTIONS);
}

const MISSION_PROPERTIES = ["gameId", "name", "beginTime", "endTime", "detailsHtml", "accessGroupId", "rsvpersGroupId"];
const MISSION_COLLECTIONS = [];
Model.Mission = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, MISSION_PROPERTIES);
  Utils.addEmptyLists(this, MISSION_COLLECTIONS);
}

const ADMIN_PROPERTIES = ["userId"];
const ADMIN_COLLECTIONS = [];
Model.Admin = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, ADMIN_PROPERTIES);
  Utils.addEmptyLists(this, ADMIN_COLLECTIONS);
}

const QUEUED_NOTIFICATION_PROPERTIES = ["gameId", "message", "site", "mobile", "previewMessage", "sendTime", "sent", "groupId", "email", "sound", "vibrate", "destination", "icon"];
const QUEUED_NOTIFICATION_COLLECTIONS = [];
Model.QueuedNotification = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, QUEUED_NOTIFICATION_PROPERTIES);
  Utils.addEmptyLists(this, QUEUED_NOTIFICATION_COLLECTIONS);
}

const PLAYER_PROPERTIES = ["active", "userId", "number", "allegiance", "name", "points", "profileImageUrl", "gameId", "userId", "canInfect", "needGun", "startAsZombie", "wantToBeSecretZombie", "gotEquipment", "notes"];
const PLAYER_COLLECTIONS = ["infections", "lives", "claims", "notifications", "chatRoomMemberships", "groupMemberships", "missionMemberships"];
const PLAYER_VOLUNTEER_PROPERTIES = ["advertising", "logistics", "communications", "moderator", "cleric", "sorcerer", "admin", "photographer", "chronicler", "android", "ios", "server", "client"];
const PLAYER_NOTIFICATION_SETTINGS_PROPERTIES = ["sound", "vibrate"];
Model.Player = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, PLAYER_PROPERTIES);
  Utils.addEmptyLists(this, PLAYER_COLLECTIONS);
  this.volunteer = {};
  Utils.copyProperties(this.volunteer, args.volunteer, PLAYER_VOLUNTEER_PROPERTIES);
  this.notificationSettings = {};
  Utils.copyProperties(this.notificationSettings, args.notificationSettings, PLAYER_NOTIFICATION_SETTINGS_PROPERTIES);
}

const CLAIM_PROPERTIES = ["time", "rewardId", "rewardCategoryId"];
const CLAIM_COLLECTIONS = [];
Model.Claim = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, CLAIM_PROPERTIES);
  Utils.addEmptyLists(this, CLAIM_COLLECTIONS);
}

const LIFE_PROPERTIES = ["time", "code"];
const LIFE_COLLECTIONS = [];
Model.Life = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, LIFE_PROPERTIES);
  Utils.addEmptyLists(this, LIFE_COLLECTIONS);
}

const INFECTION_PROPERTIES = ["time", "infectorId"];
const INFECTION_COLLECTIONS = [];
Model.Infection = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, INFECTION_PROPERTIES);
  Utils.addEmptyLists(this, INFECTION_COLLECTIONS);
}

const NOTIFICATION_PROPERTIES = ["message", "previewMessage", "queuedNotificationId", "seenTime", "sound", "vibrate", "site", "mobile", "time", "email", "destination"];
const NOTIFICATION_COLLECTIONS = [];
Model.Notification = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, NOTIFICATION_PROPERTIES);
  Utils.addEmptyLists(this, NOTIFICATION_COLLECTIONS);
}

const REWARD_CATEGORY_PROPERTIES = ["name", "shortName", "points", "claimed", "gameId", "limitPerPlayer", "badgeImageUrl"];
const REWARD_CATEGORY_COLLECTIONS = ["rewards"];
Model.RewardCategory = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, REWARD_CATEGORY_PROPERTIES);
  Utils.addEmptyLists(this, REWARD_CATEGORY_COLLECTIONS);
}

const REWARD_PROPERTIES = ["playerId", "code"];
const REWARD_COLLECTIONS = [];
Model.Reward = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, REWARD_PROPERTIES);
  Utils.addEmptyLists(this, REWARD_COLLECTIONS);
}

const DEFAULT_PROFILE_IMAGE_PROPERTIES = ["gameId", "defaultProfileImageId", "allegianceFilter", "profileImageUrl"];
const DEFAULT_PROFILE_IMAGE_COLLECTIONS = [];
Model.DefaultProfileImage = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, DEFAULT_PROFILE_IMAGE_PROPERTIES);
  Utils.addEmptyLists(this, DEFAULT_PROFILE_IMAGE_COLLECTIONS);
}


return Model;

})();
