
const GUN_PROPERTIES = ["gameId", "playerId"];
const GUN_COLLECTIONS = [];
function newGun(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, GUN_PROPERTIES);
  Utils.addEmptyLists(obj, GUN_COLLECTIONS);
  return obj;
}

const USER_PROPERTIES = [];
const USER_COLLECTIONS = ["players"];
function newUser(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, USER_PROPERTIES);
  Utils.addEmptyLists(obj, USER_COLLECTIONS);
  return obj;
}

const PRIVATE_PLAYER_PROPERTIES = ["gameId", "userId", "canInfect", "needGun", "startAsZombie", "wantsToBeSecretZombie", "gotEquipment", "phone", "notes"];
const PRIVATE_PLAYER_NOTIFICATION_SETTINGS_PROPERTIES = ["sound", "vibrate"];
const PRIVATE_PLAYER_VOLUNTEER_PROPERTIES = ["advertising", "logistics", "communications", "moderator", "cleric", "sorcerer", "admin", "photographer", "chronicler", "mobile", "server", "client"];
const PRIVATE_PLAYER_COLLECTIONS = ["lives"];

const USER_PLAYER_PROPERTIES = ["gameId", "userId"];
const USER_PLAYER_COLLECTIONS = [];
function newUserPlayer(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, USER_PLAYER_PROPERTIES);
  Utils.addEmptyLists(obj, USER_PLAYER_COLLECTIONS);
  return obj;
}

const GAME_PROPERTIES = ["active", "name", "number", "rulesHtml", "stunTimer", "contactAdminPlayerId"];
const GAME_COLLECTIONS = ["missions", "rewardCategories", "chatRooms", "players", "admins", "notificationCategories", "quizQuestions", "groups"];
function newGame(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, GAME_PROPERTIES);
  Utils.addEmptyLists(obj, GAME_COLLECTIONS);
  return obj;
}

const QUIZ_QUESTION_PROPERTIES = ["text", "type"];
const QUIZ_QUESTION_COLLECTIONS = ["answers"];
function newQuizQuestion(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, QUIZ_QUESTION_PROPERTIES);
  Utils.addEmptyLists(obj, QUIZ_QUESTION_COLLECTIONS);
  return obj;
}

const QUIZ_ANSWER_PROPERTIES = ["text", "isCorrect", "order"];
const QUIZ_ANSWER_COLLECTIONS = [];
function newQuizAnswer(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, QUIZ_ANSWER_PROPERTIES);
  Utils.addEmptyLists(obj, QUIZ_ANSWER_COLLECTIONS);
  return obj;
}

const GROUP_PROPERTIES = ["gameId", "allegianceFilter", "autoAdd", "membersCanAdd", "autoRemove"];
const GROUP_COLLECTIONS = ["memberships"];
function newGroup(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, GROUP_PROPERTIES);
  Utils.addEmptyLists(obj, GROUP_COLLECTIONS);
  return obj;
}

const CHAT_ROOM_PROPERTIES = ["gameId", "name", "groupId", "withAdmin"];
const CHAT_ROOM_COLLECTIONS = ["messages"];
function newChatRoom(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, CHAT_ROOM_PROPERTIES);
  Utils.addEmptyLists(obj, CHAT_ROOM_COLLECTIONS);
  return obj;
}

const GROUP_MEMBERSHIP_PROPERTIES = ["playerId"];
const GROUP_MEMBERSHIP_COLLECTIONS = [];
function newGroupMembership(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, GROUP_MEMBERSHIP_PROPERTIES);
  Utils.addEmptyLists(obj, GROUP_MEMBERSHIP_COLLECTIONS);
  return obj;
}

const PLAYER_CHAT_ROOM_MEMBERSHIP_PROPERTIES = ["chatRoomId"];
const PLAYER_CHAT_ROOM_MEMBERSHIP_COLLECTIONS = [];
function newPlayerChatRoomMembership(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, PLAYER_CHAT_ROOM_MEMBERSHIP_PROPERTIES);
  Utils.addEmptyLists(obj, PLAYER_CHAT_ROOM_MEMBERSHIP_COLLECTIONS);
  return obj;
}

const PLAYER_GROUP_MEMBERSHIP_PROPERTIES = ["groupId"];
const PLAYER_GROUP_MEMBERSHIP_COLLECTIONS = [];
function newPlayerGroupMembership(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, PLAYER_GROUP_MEMBERSHIP_PROPERTIES);
  Utils.addEmptyLists(obj, PLAYER_GROUP_MEMBERSHIP_COLLECTIONS);
  return obj;
}

const MESSAGE_PROPERTIES = ["index", "message", "playerId", "time"];
const MESSAGE_COLLECTIONS = [];
function newMessage(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, MESSAGE_PROPERTIES);
  Utils.addEmptyLists(obj, MESSAGE_COLLECTIONS);
  return obj;
}

const MISSION_PROPERTIES = ["gameId", "name", "beginTime", "endTime", "detailsHtml", "allegianceFilter"];
const MISSION_COLLECTIONS = [];
function newMission(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, MISSION_PROPERTIES);
  Utils.addEmptyLists(obj, MISSION_COLLECTIONS);
  return obj;
}

const ADMIN_PROPERTIES = ["userId"];
const ADMIN_COLLECTIONS = [];
function newAdmin(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, ADMIN_PROPERTIES);
  Utils.addEmptyLists(obj, ADMIN_COLLECTIONS);
  return obj;
}

const NOTIFICATION_CATEGORY_PROPERTIES = ["gameId", "name", "message", "previewMessage", "sendTime", "allegianceFilter", "email", "app", "sound", "vibrate", "destination", "icon"];
const NOTIFICATION_CATEGORY_COLLECTIONS = [];
function newNotificationCategory(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, NOTIFICATION_CATEGORY_PROPERTIES);
  Utils.addEmptyLists(obj, NOTIFICATION_CATEGORY_COLLECTIONS);
  return obj;
}

const PLAYER_PROPERTIES = ["active", "userId", "number", "allegiance", "name", "points", "profileImageUrl"];
const PLAYER_COLLECTIONS = ["infections", "lives", "claims", "notifications", "chatRoomMemberships", "groupMemberships"];
function newPlayer(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, PLAYER_PROPERTIES);
  Utils.addEmptyLists(obj, PLAYER_COLLECTIONS);
  obj.volunteer = {};
  obj.notificationSettings = {};
  return obj;
}

const CLAIM_PROPERTIES = ["time", "rewardId", "rewardCategoryId"];
const CLAIM_COLLECTIONS = [];
function newClaim(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, CLAIM_PROPERTIES);
  Utils.addEmptyLists(obj, CLAIM_COLLECTIONS);
  return obj;
}

const LIFE_PROPERTIES = ["time", "code"];
const LIFE_COLLECTIONS = [];
function newLife(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, LIFE_PROPERTIES);
  Utils.addEmptyLists(obj, LIFE_COLLECTIONS);
  return obj;
}

const INFECTION_PROPERTIES = ["time", "infectorId"];
const INFECTION_COLLECTIONS = [];
function newInfection(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, INFECTION_PROPERTIES);
  Utils.addEmptyLists(obj, INFECTION_COLLECTIONS);
  return obj;
}

const NOTIFICATION_PROPERTIES = ["message", "previewMessage", "notificationCategoryId", "seenTime", "sound", "vibrate", "app", "email", "destination"];
const NOTIFICATION_COLLECTIONS = [];
function newNotification(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, NOTIFICATION_PROPERTIES);
  Utils.addEmptyLists(obj, NOTIFICATION_COLLECTIONS);
  return obj;
}

const REWARD_CATEGORY_PROPERTIES = ["name", "points", "seed", "claimed", "gameId", "limitPerPlayer"];
const REWARD_CATEGORY_COLLECTIONS = ["rewards"];
function newRewardCategory(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, REWARD_CATEGORY_PROPERTIES);
  Utils.addEmptyLists(obj, REWARD_CATEGORY_COLLECTIONS);
  return obj;
}

const REWARD_PROPERTIES = ["playerId", "code"];
const REWARD_COLLECTIONS = [];
function newReward(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, REWARD_PROPERTIES);
  Utils.addEmptyLists(obj, REWARD_COLLECTIONS);
  return obj;
}

