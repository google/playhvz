// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO: High-level file comment.

'use strict';

window.Model = (function() {

var Model = {};

Model.GUN_PROPERTIES = ["gameId", "playerId", "label"];
Model.GUN_COLLECTIONS = [];
Model.Gun = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.GUN_PROPERTIES);
  Utils.addEmptyLists(this, Model.GUN_COLLECTIONS);
}

Model.USER_PROPERTIES = ["deviceToken", "a"];
Model.USER_COLLECTIONS = ["publicPlayers"];
Model.User = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.USER_PROPERTIES);
  Utils.addEmptyLists(this, Model.USER_COLLECTIONS);
}

Model.USER_PUBLIC_PLAYER_PROPERTIES = ["gameId", "userId"];
Model.USER_PUBLIC_PLAYER_COLLECTIONS = [];
Model.UserPublicPlayer = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.USER_PUBLIC_PLAYER_PROPERTIES);
  Utils.addEmptyLists(this, Model.USER_PUBLIC_PLAYER_COLLECTIONS);
}

Model.GAME_PROPERTIES = ["isActive", "started", "name", "number", "rulesHtml", "faqHtml", "stunTimer", "adminContactPlayerId", "startTime", "endTime", "registrationEndTime", "declareHordeEndTime", "declareResistanceEndTime"];
Model.GAME_COLLECTIONS = ["guns", "missions", "rewardCategories", "chatRooms", "players", "admins", "queuedNotifications", "quizQuestions", "groups", "maps", "defaultProfileImages"];
Model.Game = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.GAME_PROPERTIES);
  Utils.addEmptyLists(this, Model.GAME_COLLECTIONS);
}

Model.QUIZ_QUESTION_PROPERTIES = ["text", "type", "number"];
Model.QUIZ_QUESTION_COLLECTIONS = ["answers"];
Model.QuizQuestion = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.QUIZ_QUESTION_PROPERTIES);
  Utils.addEmptyLists(this, Model.QUIZ_QUESTION_COLLECTIONS);
}

Model.QUIZ_ANSWER_PROPERTIES = ["text", "isCorrect", "order", "number"];
Model.QUIZ_ANSWER_COLLECTIONS = [];
Model.QuizAnswer = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.QUIZ_ANSWER_PROPERTIES);
  Utils.addEmptyLists(this, Model.QUIZ_ANSWER_COLLECTIONS);
}

Model.GROUP_PROPERTIES = ["name", "gameId", "allegianceFilter", "autoAdd", "canAddOthers", "canRemoveOthers", "canAddSelf", "canRemoveSelf", "autoRemove", "ownerPlayerId"];
Model.GROUP_COLLECTIONS = ["players"];
Model.Group = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.GROUP_PROPERTIES);
  Utils.addEmptyLists(this, Model.GROUP_COLLECTIONS);
}

Model.CHAT_ROOM_PROPERTIES = ["gameId", "name", "accessGroupId", "withAdmins"];
Model.CHAT_ROOM_COLLECTIONS = ["messages", "requestCategories"];
Model.ChatRoom = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.CHAT_ROOM_PROPERTIES);
  Utils.addEmptyLists(this, Model.CHAT_ROOM_COLLECTIONS);
}

Model.MAP_PROPERTIES = ["gameId", "name", "groupId"];
Model.MAP_COLLECTIONS = ["markers"];
Model.Map = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.MAP_PROPERTIES);
  Utils.addEmptyLists(this, Model.MAP_COLLECTIONS);
}

Model.MARKER_PROPERTIES = ["name", "color", "playerId", "latitude", "longitude"];
Model.MARKER_COLLECTIONS = [];
Model.Marker = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.MARKER_PROPERTIES);
  Utils.addEmptyLists(this, Model.MARKER_COLLECTIONS);
}

// Model.GROUP_MEMBERSHIP_PROPERTIES = ["playerId"];
// Model.GROUP_MEMBERSHIP_COLLECTIONS = [];
// Model.GroupMembership = function(id, args) {
//   this.id = id;
//   Utils.copyProperties(this, args, Model.GROUP_MEMBERSHIP_PROPERTIES);
//   Utils.addEmptyLists(this, Model.GROUP_MEMBERSHIP_COLLECTIONS);
// }

Model.PLAYER_CHAT_ROOM_MEMBERSHIP_PROPERTIES = ["chatRoomId", "isVisible"];
Model.PLAYER_CHAT_ROOM_MEMBERSHIP_COLLECTIONS = [];
Model.PlayerChatRoomMembership = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.PLAYER_CHAT_ROOM_MEMBERSHIP_PROPERTIES);
  Utils.addEmptyLists(this, Model.PLAYER_CHAT_ROOM_MEMBERSHIP_COLLECTIONS);
  assert(this.chatRoomId);
}

Model.PLAYER_MISSION_MEMBERSHIP_PROPERTIES = ["missionId"];
Model.PLAYER_MISSION_MEMBERSHIP_COLLECTIONS = [];
Model.PlayerMissionMembership = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.PLAYER_MISSION_MEMBERSHIP_PROPERTIES);
  Utils.addEmptyLists(this, Model.PLAYER_MISSION_MEMBERSHIP_COLLECTIONS);
}

Model.PLAYER_GROUP_MEMBERSHIP_PROPERTIES = ["groupId"];
Model.PLAYER_GROUP_MEMBERSHIP_COLLECTIONS = [];
Model.PlayerGroupMembership = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.PLAYER_GROUP_MEMBERSHIP_PROPERTIES);
  Utils.addEmptyLists(this, Model.PLAYER_GROUP_MEMBERSHIP_COLLECTIONS);
}

Model.MESSAGE_PROPERTIES = ["index", "message", "playerId", "time", "location"];
Model.MESSAGE_COLLECTIONS = [];
Model.Message = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.MESSAGE_PROPERTIES);
  Utils.addEmptyLists(this, Model.MESSAGE_COLLECTIONS);
}

Model.REQUEST_CATEGORY_PROPERTIES = ["playerId", "time", "text", "type", "dismissed"];
Model.REQUEST_CATEGORY_COLLECTIONS = ["requests"];
Model.RequestCategory = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.REQUEST_CATEGORY_PROPERTIES);
  Utils.addEmptyLists(this, Model.REQUEST_CATEGORY_COLLECTIONS);
}

Model.REQUEST_PROPERTIES = ["playerId", "response"];
Model.REQUEST_COLLECTIONS = [];
Model.Request = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.REQUEST_PROPERTIES);
  Utils.addEmptyLists(this, Model.REQUEST_COLLECTIONS);
}

Model.RESPONSE_PROPERTIES = ["time", "text"];
Model.RESPONSE_COLLECTIONS = [];
Model.Response = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.RESPONSE_PROPERTIES);
  Utils.addEmptyLists(this, Model.RESPONSE_COLLECTIONS);
}

Model.MISSION_PROPERTIES = ["gameId", "name", "beginTime", "endTime", "detailsHtml", "accessGroupId", "rsvpersGroupId"];
Model.MISSION_COLLECTIONS = [];
Model.Mission = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.MISSION_PROPERTIES);
  Utils.addEmptyLists(this, Model.MISSION_COLLECTIONS);
}

Model.ADMIN_PROPERTIES = ["userId"];
Model.ADMIN_COLLECTIONS = [];
Model.Admin = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.ADMIN_PROPERTIES);
  Utils.addEmptyLists(this, Model.ADMIN_COLLECTIONS);
}

Model.QUEUED_NOTIFICATION_PROPERTIES = ["gameId", "message", "site", "mobile", "previewMessage", "sendTime", "sent", "groupId", "email", "sound", "vibrate", "destination", "icon"];
Model.QUEUED_NOTIFICATION_COLLECTIONS = [];
Model.QueuedNotification = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.QUEUED_NOTIFICATION_PROPERTIES);
  Utils.addEmptyLists(this, Model.QUEUED_NOTIFICATION_COLLECTIONS);
}

Model.PUBLIC_PLAYER_PROPERTIES = ["isActive", "userId", "number", "allegiance", "name", "points", "profileImageUrl", "gameId", "userId", "privatePlayerId", "private"];
Model.PUBLIC_PLAYER_COLLECTIONS = ["infections", "lives", "claims"];
Model.PublicPlayer = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.PUBLIC_PLAYER_PROPERTIES);
  Utils.addEmptyLists(this, Model.PUBLIC_PLAYER_COLLECTIONS);
  if (!this.private)
    this.private = null;
}

Model.PRIVATE_PLAYER_PROPERTIES = ["isActive", "beInPhotos", "userId", "gameId", "userId", "canInfect", "needGun", "startAsZombie", "wantToBeSecretZombie", "gotEquipment", "notes"];
Model.PRIVATE_PLAYER_COLLECTIONS = ["notifications", "chatRoomMemberships", "groupMemberships", "missionMemberships", "mapMemberships"];
Model.PRIVATE_PLAYER_VOLUNTEER_PROPERTIES = ["advertising", "logistics", "communications", "moderator", "cleric", "sorcerer", "admin", "photographer", "chronicler", "android", "ios", "server", "client"];
Model.PRIVATE_PLAYER_NOTIFICATION_SETTINGS_PROPERTIES = ["sound", "vibrate"];
Model.PrivatePlayer = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.PRIVATE_PLAYER_PROPERTIES);
  Utils.addEmptyLists(this, Model.PRIVATE_PLAYER_COLLECTIONS);
  this.volunteer = {};
  Utils.copyProperties(this.volunteer, args.volunteer, Model.PRIVATE_PLAYER_VOLUNTEER_PROPERTIES);
  this.notificationSettings = {};
  Utils.copyProperties(this.notificationSettings, args.notificationSettings, Model.PRIVATE_PLAYER_NOTIFICATION_SETTINGS_PROPERTIES);
}

Model.CLAIM_PROPERTIES = ["time", "rewardId", "rewardCategoryId"];
Model.CLAIM_COLLECTIONS = [];
Model.Claim = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.CLAIM_PROPERTIES);
  Utils.addEmptyLists(this, Model.CLAIM_COLLECTIONS);
}

Model.PUBLIC_LIFE_PROPERTIES = ["time", "private", "privateLifeId", "gameId"];
Model.PUBLIC_LIFE_COLLECTIONS = [];
Model.PublicLife = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.PUBLIC_LIFE_PROPERTIES);
  Utils.addEmptyLists(this, Model.PUBLIC_LIFE_COLLECTIONS);
}

Model.PRIVATE_LIFE_PROPERTIES = ["code", "gameId"];
Model.PRIVATE_LIFE_COLLECTIONS = [];
Model.PrivateLife = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.PRIVATE_LIFE_PROPERTIES);
  Utils.addEmptyLists(this, Model.PRIVATE_LIFE_COLLECTIONS);
}

Model.INFECTION_PROPERTIES = ["time", "infectorId"];
Model.INFECTION_COLLECTIONS = [];
Model.Infection = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.INFECTION_PROPERTIES);
  Utils.addEmptyLists(this, Model.INFECTION_COLLECTIONS);
}

Model.NOTIFICATION_PROPERTIES = ["message", "previewMessage", "queuedNotificationId", "seenTime", "sound", "vibrate", "site", "mobile", "time", "email", "destination", "icon"];
Model.NOTIFICATION_COLLECTIONS = [];
Model.Notification = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.NOTIFICATION_PROPERTIES);
  Utils.addEmptyLists(this, Model.NOTIFICATION_COLLECTIONS);
}

Model.REWARD_CATEGORY_PROPERTIES = ["name", "shortName", "points", "claimed", "gameId", "limitPerPlayer", "badgeImageUrl", "gameId", "description"];
Model.REWARD_CATEGORY_COLLECTIONS = ["rewards"];
Model.RewardCategory = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.REWARD_CATEGORY_PROPERTIES);
  Utils.addEmptyLists(this, Model.REWARD_CATEGORY_COLLECTIONS);
}

Model.REWARD_PROPERTIES = ["playerId", "code", "rewardCategoryId", "gameId"];
Model.REWARD_COLLECTIONS = [];
Model.Reward = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.REWARD_PROPERTIES);
  Utils.addEmptyLists(this, Model.REWARD_COLLECTIONS);
}

Model.DEFAULT_PROFILE_IMAGE_PROPERTIES = ["gameId", "defaultProfileImageId", "allegianceFilter", "profileImageUrl"];
Model.DEFAULT_PROFILE_IMAGE_COLLECTIONS = [];
Model.DefaultProfileImage = function(id, args) {
  this.id = id;
  Utils.copyProperties(this, args, Model.DEFAULT_PROFILE_IMAGE_PROPERTIES);
  Utils.addEmptyLists(this, Model.DEFAULT_PROFILE_IMAGE_COLLECTIONS);
}


return Model;

})();
