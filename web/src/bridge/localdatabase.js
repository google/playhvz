
const GUN_PROPERTIES = ["number", "playerId"];
const GUN_COLLECTIONS = [];
function newGun(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, GUN_PROPERTIES);
  Utils.addEmptyLists(obj, GUN_COLLECTIONS);
  return obj;
}

const USER_PROPERTIES = ["placeholder"];
const USER_COLLECTIONS = ["players",];
function newUser(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, USER_PROPERTIES);
  Utils.addEmptyLists(obj, USER_COLLECTIONS);
  return obj;
}

const USER_PLAYER_PROPERTIES = ["gameId", "playerId"];
const USER_PLAYER_COLLECTIONS = [];
function newUserPlayer(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, USER_PROPERTIES);
  Utils.addEmptyLists(obj, USER_COLLECTIONS);
  return obj;
}

const GAME_PROPERTIES = ["name", "number", "rulesUrl", "stunTimer"];
const GAME_COLLECTIONS = ["missions", "rewardCategories", "chatRooms", "players", "admins", "notificationCategories"];
function newGame(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, GAME_PROPERTIES);
  Utils.addEmptyLists(obj, GAME_COLLECTIONS);
  return obj;
}

const CHAT_ROOM_PROPERTIES = ["allegianceFilter", "name"];
const CHAT_ROOM_COLLECTIONS = ["messages", "memberships",];
function newChatRoom(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, CHAT_ROOM_PROPERTIES);
  Utils.addEmptyLists(obj, CHAT_ROOM_COLLECTIONS);
  return obj;
}

const MEMBERSHIP_PROPERTIES = ["playerId"];
const MEMBERSHIP_COLLECTIONS = [];
function newMembership(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, MEMBERSHIP_PROPERTIES);
  Utils.addEmptyLists(obj, MEMBERSHIP_COLLECTIONS);
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

const MISSION_PROPERTIES = ["name", "beginTime", "endTime", "url", "allegianceFilter"];
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

const NOTIFICATION_CATEGORY_PROPERTIES = ["name", "message", "previewMessage", "sendTime", "allegianceFilter", "email", "app", "sound", "vibrate", "destination", "icon"];
const NOTIFICATION_CATEGORY_COLLECTIONS = [];
function newNotificationCategory(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, NOTIFICATION_CATEGORY_PROPERTIES);
  Utils.addEmptyLists(obj, NOTIFICATION_CATEGORY_COLLECTIONS);
  return obj;
}

const PLAYER_PROPERTIES = ["userId", "number", "allegiance", "infectable", "name", "needGun", "points", "profileImageUrl", "startAsZombie", "volunteer"];
const PLAYER_COLLECTIONS = ["infections", "lives", "rewards", "notifications",];
function newPlayer(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, PLAYER_PROPERTIES);
  Utils.addEmptyLists(obj, PLAYER_COLLECTIONS);
  return obj;
}

const PLAYER_REWARD_PROPERTIES = ["time", "rewardId", "rewardCategoryId"];
const PLAYER_REWARD_COLLECTIONS = [];
function newPlayerReward(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, PLAYER_REWARD_PROPERTIES);
  Utils.addEmptyLists(obj, PLAYER_REWARD_COLLECTIONS);
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

const REWARD_CATEGORY_PROPERTIES = ["name", "points", "seed", "claimed"];
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

class LocalDatabase {
  constructor(delegate) {
    this.delegate = delegate;
  }
  get(path) {
    return this.delegate.get(path);
  }
  set(path, value) {
    this.delegate.set(path, value);
  }
  insert(path, value, indexOrNull) {
    assert(path instanceof Array);
    assert(typeof value == 'object');
    assert(path);
    assert(value);
    assert(indexOrNull == null || typeof indexOrNull == 'number');
    for (var key in value) {
      if (value[key] instanceof Array) {
        assert(value[key].length == 0); // curiosity
        value[key + "ById"] = {};
      }
    }
    this.delegate.insert(path, value, indexOrNull);
    let mapPath = path.slice();
    mapPath[mapPath.length - 1] += "ById";
    let pathInMap = mapPath.concat([value.id]);
    this.delegate.set(pathInMap, value);
  }
  remove(path) {
    this.delegate.remove(path);
  }
  getGamePath_(gameId) {
    assert(typeof gameId == 'string' || gameId == null);
    let path = ["games"];
    if (gameId)
      path = path.concat([Utils.findIndexById(this.get(path), gameId)]);
    return path;
  }
  getGunPath_(gunId) {
    assert(typeof gunId == 'string' || gunId == null);
    let path = ["guns"];
    if (gunId)
      path = path.concat([Utils.findIndexById(this.get(path), gunId)]);
    return path;
  }
  getUserPath_(userId) {
    assert(typeof userId == 'string' || userId == null);
    let path = ["users"];
    if (userId)
      path = path.concat([Utils.findIndexById(this.get(path), userId)]);
    return path;
  }
  getUserPlayerPath_(userId, userPlayerId) {
    assert(userId);
    assert(typeof userPlayerId == 'string' || userPlayerId == null);
    let path = this.getUserPath_(userId).concat(["players"]);
    if (userPlayerId)
      path = path.concat([Utils.findIndexById(this.get(path), userPlayerId)]);
    return path;
  }
  getPlayerPath_(gameId, playerId) {
    assert(gameId);
    assert(typeof playerId == 'string' || playerId == null);
    let path = this.getGamePath_(gameId).concat(["players"]);
    if (playerId)
      path = path.concat([Utils.findIndexById(this.get(path), playerId)]);
    return path;
  }
  getPlayerRewardPath_(gameId, playerId, rewardId) {
    assert(gameId);
    assert(playerId);
    assert(typeof rewardId == 'string' || rewardId == null);
    let path = this.getPlayerPath_(gameId, playerId).concat(["rewards"]);
    if (rewardId)
      path = path.concat([Utils.findIndexById(this.get(path), rewardId)]);
    return path;
  }
  getPlayerLifePath_(gameId, playerId, lifeId) {
    assert(gameId);
    assert(playerId);
    assert(typeof lifeId == 'string' || lifeId == null);
    let path = this.getPlayerPath_(gameId, playerId).concat(["lives"]);
    if (lifeId)
      path = path.concat([Utils.findIndexById(this.get(path), lifeId)]);
    return path;
  }
  getPlayerInfectionPath_(gameId, playerId, infectionId) {
    assert(gameId);
    assert(playerId);
    assert(typeof infectionId == 'string' || infectionId == null);
    let path = this.getPlayerPath_(gameId, playerId).concat(["infections"]);
    if (infectionId)
      path = path.concat([Utils.findIndexById(this.get(path), infectionId)]);
    return path;
  }
  getPlayerNotificationPath_(gameId, playerId, notificationId) {
    assert(gameId);
    assert(playerId);
    assert(typeof notificationId == 'string' || notificationId == null);
    let path = this.getPlayerPath_(gameId, playerId).concat(["notifications"]);
    if (notificationId)
      path = path.concat([Utils.findIndexById(this.get(path), notificationId)]);
    return path;
  }
  getMissionPath_(gameId, missionId) {
    assert(gameId);
    assert(typeof missionId == 'string' || missionId == null);
    let path = this.getGamePath_(gameId).concat(["missions"]);
    if (missionId)
      path = path.concat([Utils.findIndexById(this.get(path), missionId)]);
    return path;
  }
  getRewardCategoryPath_(gameId, rewardCategoryId) {
    assert(gameId);
    assert(typeof rewardCategoryId == 'string' || rewardCategoryId == null);
    let path = this.getGamePath_(gameId).concat(["rewardCategories"]);
    if (rewardCategoryId)
      path = path.concat([Utils.findIndexById(this.get(path), rewardCategoryId)]);
    return path;
  }
  getRewardCategoryRewardPath_(gameId, rewardCategoryId, rewardId) {
    assert(gameId);
    assert(rewardCategoryId);
    assert(typeof rewardId == 'string' || rewardId == null);
    let path = this.getRewardCategoryPath_(gameId, rewardCategoryId).concat(["rewards"]);
    if (rewardId)
      path = path.concat([Utils.findIndexById(this.get(path), rewardId)]);
    return path;
  }
  getNotificationCategoryPath_(gameId, notificationCategoryId) {
    assert(gameId);
    assert(typeof notificationCategoryId == 'string' || notificationCategoryId == null);
    let path = this.getGamePath_(gameId).concat(["notificationCategories"]);
    if (notificationCategoryId)
      path = path.concat([Utils.findIndexById(this.get(path), notificationCategoryId)]);
    return path;
  }
  getChatRoomPath_(gameId, chatRoomId) {
    assert(gameId);
    assert(typeof chatRoomId == 'string' || chatRoomId == null);
    let path = this.getGamePath_(gameId).concat(["chatRooms"]);
    if (chatRoomId)
      path = path.concat([Utils.findIndexById(this.get(path), chatRoomId)]);
    return path;
  }
  getChatRoomMembershipPath_(gameId, chatRoomId, membershipId) {
    assert(gameId);
    assert(chatRoomId);
    assert(typeof membershipId == 'string' || membershipId == null);
    let path = this.getChatRoomPath_(gameId, chatRoomId).concat(["memberships"]);
    if (membershipId)
      path = path.concat([Utils.findIndexById(this.get(path), membershipId)]);
    return path;
  }
  getChatRoomMessagePath_(gameId, chatRoomId, messageId) {
    assert(gameId);
    assert(chatRoomId);
    assert(typeof messageId == 'string' || messageId == null);
    let path = this.getChatRoomPath_(gameId, chatRoomId).concat(["messages"]);
    if (messageId)
      path = path.concat([Utils.findIndexById(this.get(path), messageId)]);
    return path;
    return obj;
  }
}
