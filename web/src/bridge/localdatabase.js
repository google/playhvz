
const GUN_PROPERTIES = ["playerId"];
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
  Utils.copyProperties(obj, args, USER_PLAYER_PROPERTIES);
  Utils.addEmptyLists(obj, USER_PLAYER_COLLECTIONS);
  return obj;
}

const GAME_PROPERTIES = ["active", "name", "number", "rulesUrl", "stunTimer"];
const GAME_COLLECTIONS = ["missions", "rewardCategories", "chatRooms", "players", "admins", "notificationCategories", "quizQuestions"];
function newGame(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, GAME_PROPERTIES);
  Utils.addEmptyLists(obj, GAME_COLLECTIONS);
  return obj;
}

const QUIZ_QUESTION_PROPERTIES = ["question", "type"];
const QUIZ_QUESTION_COLLECTIONS = ["answers"];
function newQuizQuestion(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, QUIZ_QUESTION_PROPERTIES);
  Utils.addEmptyLists(obj, QUIZ_QUESTION_COLLECTIONS);
  return obj;
}

const QUIZ_ANSWER_PROPERTIES = ["text", "isCorrect"];
const QUIZ_ANSWER_COLLECTIONS = [];
function newQuizAnswer(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, QUIZ_ANSWER_PROPERTIES);
  Utils.addEmptyLists(obj, QUIZ_ANSWER_COLLECTIONS);
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

const PLAYER_PROPERTIES = ["userId", "number", "allegiance", "infectable", "name", "needGun", "points", "profileImageUrl", "startAsZombie", "volunteer", "beSecretZombie"];
const PLAYER_COLLECTIONS = ["infections", "lives", "claims", "notifications"];
function newPlayer(id, args) {
  let obj = {id: id};
  Utils.copyProperties(obj, args, PLAYER_PROPERTIES);
  Utils.addEmptyLists(obj, PLAYER_COLLECTIONS);
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
  insert(path, indexOrNull, value) {
    assert(path instanceof Array);
    assert(typeof value == 'object');
    assert(path);
    assert(value);
    assert(indexOrNull == null || typeof indexOrNull == 'number');
    for (var key in value) {
      if (value[key] instanceof Array) {
        let list = value[key];
        let map = {};
        for (var elementKey in list) {
          let element = list[elementKey];
          assert(element.id);
          map[element.id] = element;
        }
        value[key + "ById"] = map;
      }
    }
    this.delegate.insert(path, indexOrNull, value);
    let mapPath = path.slice();
    mapPath[mapPath.length - 1] += "ById";
    let pathInMap = mapPath.concat([value.id]);
    this.delegate.set(pathInMap, value);
  }
  remove(path) {
    this.delegate.remove(path);
  }
  getGamePath(gameId) {
    assert(typeof gameId == 'string' || gameId == null);
    let path = ["games"];
    if (gameId)
      path = path.concat([Utils.findIndexById(this.get(path), gameId)]);
    return path;
  }
  getGunPath(gunId) {
    assert(typeof gunId == 'string' || gunId == null);
    let path = ["guns"];
    if (gunId)
      path = path.concat([Utils.findIndexById(this.get(path), gunId)]);
    return path;
  }
  getUserPath(userId) {
    assert(typeof userId == 'string' || userId == null);
    let path = ["users"];
    if (userId)
      path = path.concat([Utils.findIndexById(this.get(path), userId)]);
    return path;
  }
  getUserPlayerPath(userId, userPlayerId) {
    assert(userId);
    assert(typeof userPlayerId == 'string' || userPlayerId == null);
    let path = this.getUserPath(userId).concat(["players"]);
    if (userPlayerId)
      path = path.concat([Utils.findIndexById(this.get(path), userPlayerId)]);
    return path;
  }
  getPlayerPath(gameId, playerId) {
    assert(gameId);
    assert(typeof playerId == 'string' || playerId == null);
    let path = this.getGamePath(gameId).concat(["players"]);
    if (playerId)
      path = path.concat([Utils.findIndexById(this.get(path), playerId)]);
    return path;
  }
  getClaimPath(gameId, playerId, rewardId) {
    assert(gameId);
    assert(playerId);
    assert(typeof rewardId == 'string' || rewardId == null);
    let path = this.getPlayerPath(gameId, playerId).concat(["claims"]);
    if (rewardId)
      path = path.concat([Utils.findIndexById(this.get(path), rewardId)]);
    return path;
  }
  getLifePath(gameId, playerId, lifeId) {
    assert(gameId);
    assert(playerId);
    assert(typeof lifeId == 'string' || lifeId == null);
    let path = this.getPlayerPath(gameId, playerId).concat(["lives"]);
    if (lifeId)
      path = path.concat([Utils.findIndexById(this.get(path), lifeId)]);
    return path;
  }
  getInfectionPath(gameId, playerId, infectionId) {
    assert(gameId);
    assert(playerId);
    assert(typeof infectionId == 'string' || infectionId == null);
    let path = this.getPlayerPath(gameId, playerId).concat(["infections"]);
    if (infectionId)
      path = path.concat([Utils.findIndexById(this.get(path), infectionId)]);
    return path;
  }
  getNotificationPath(gameId, playerId, notificationId) {
    assert(gameId);
    assert(playerId);
    assert(typeof notificationId == 'string' || notificationId == null);
    let path = this.getPlayerPath(gameId, playerId).concat(["notifications"]);
    if (notificationId)
      path = path.concat([Utils.findIndexById(this.get(path), notificationId)]);
    return path;
  }
  getMembershipPath(gameId, chatRoomId, membershipId) {
    assert(gameId);
    assert(chatRoomId);
    assert(typeof membershipId == 'string' || membershipId == null);
    let path = this.getChatRoomPath(gameId, chatRoomId).concat(["memberships"]);
    if (membershipId)
      path = path.concat([Utils.findIndexById(this.get(path), membershipId)]);
    return path;
  }
  getAdminPath(gameId, adminId) {
    assert(gameId);
    assert(typeof adminId == 'string' || adminId == null);
    let path = this.getGamePath(gameId).concat(["admins"]);
    if (adminId)
      path = path.concat([Utils.findIndexById(this.get(path), adminId)]);
    return path;
  }
  getMissionPath(gameId, missionId) {
    assert(gameId);
    assert(typeof missionId == 'string' || missionId == null);
    let path = this.getGamePath(gameId).concat(["missions"]);
    if (missionId)
      path = path.concat([Utils.findIndexById(this.get(path), missionId)]);
    return path;
  }
  getRewardCategoryPath(gameId, rewardCategoryId) {
    assert(gameId);
    assert(typeof rewardCategoryId == 'string' || rewardCategoryId == null);
    let path = this.getGamePath(gameId).concat(["rewardCategories"]);
    if (rewardCategoryId)
      path = path.concat([Utils.findIndexById(this.get(path), rewardCategoryId)]);
    return path;
  }
  getRewardPath(gameId, rewardCategoryId, rewardId) {
    assert(gameId);
    assert(rewardCategoryId);
    assert(typeof rewardId == 'string' || rewardId == null);
    let path = this.getRewardCategoryPath(gameId, rewardCategoryId).concat(["rewards"]);
    if (rewardId)
      path = path.concat([Utils.findIndexById(this.get(path), rewardId)]);
    return path;
  }
  getNotificationCategoryPath(gameId, notificationCategoryId) {
    assert(gameId);
    assert(typeof notificationCategoryId == 'string' || notificationCategoryId == null);
    let path = this.getGamePath(gameId).concat(["notificationCategories"]);
    if (notificationCategoryId)
      path = path.concat([Utils.findIndexById(this.get(path), notificationCategoryId)]);
    return path;
  }
  getChatRoomPath(gameId, chatRoomId) {
    assert(gameId);
    assert(typeof chatRoomId == 'string' || chatRoomId == null);
    let path = this.getGamePath(gameId).concat(["chatRooms"]);
    if (chatRoomId)
      path = path.concat([Utils.findIndexById(this.get(path), chatRoomId)]);
    return path;
  }
  getChatRoomMembershipPath(gameId, chatRoomId, membershipId) {
    assert(gameId);
    assert(chatRoomId);
    assert(typeof membershipId == 'string' || membershipId == null);
    let path = this.getChatRoomPath(gameId, chatRoomId).concat(["memberships"]);
    if (membershipId)
      path = path.concat([Utils.findIndexById(this.get(path), membershipId)]);
    return path;
  }
  getChatRoomMessagePath(gameId, chatRoomId, messageId) {
    assert(gameId);
    assert(chatRoomId);
    assert(typeof messageId == 'string' || messageId == null);
    let path = this.getChatRoomPath(gameId, chatRoomId).concat(["messages"]);
    if (messageId)
      path = path.concat([Utils.findIndexById(this.get(path), messageId)]);
    return path;
    return obj;
  }
  getGameIdAndPlayerIdForNotificationId(notificationId) {
    let path = this.pathForId_(notificationId);
    let gameId = this.delegate.get(path.slice(0, 2)).id;
    let playerId = this.delegate.get(path.slice(0, 4)).id;
    return [gameId, playerId];
  }
  getGameIdForNotificationCategoryId(notificationCategoryId) {
    let path = this.pathForId_(notificationCategoryId);
    return this.delegate.get(path.slice(0, 2)).id;
  }
  getGameIdForRewardCategoryId(rewardCategoryId) {
    let path = this.pathForId_(rewardCategoryId);
    return this.delegate.get(path.slice(0, 2)).id;
  }
  getGameIdForPlayerId(playerId) {
    let path = this.pathForId_(playerId);
    return this.delegate.get(path.slice(0, 2)).id;
  }
  getGameIdForChatRoomId(chatRoomId) {
    let path = this.pathForId_(chatRoomId);
    return this.delegate.get(path.slice(0, 2)).id;
  }


  idExists(id, allowNotFound) {
    return this.objForId_(id, allowNotFound);
  }
  objForId_(id, allowNotFound) {
    assert(id);
    let result = this.objForIdInner_(this.delegate.get([]), id);
    if (!allowNotFound)
      assert(result);
    return result;
  }
  objForIdInner_(obj, id) {
    assert(typeof obj == 'object');
    if (obj) {
      if (obj.id == id)
        return obj;
      for (var key in obj) {
        if (typeof obj[key] == 'object') {
          let found = this.objForIdInner_(obj[key], id);
          if (found)
            return found;
        }
      }
    }
    return null;
  }
  pathForId_(id, allowNotFound) {
    assert(id);
    let result = this.pathForIdInner_([], this.delegate.get([]), id);
    if (!allowNotFound)
      assert(result);
    return result;
  }
  pathForIdInner_(path, obj, id) {
    assert(typeof obj == 'object');
    if (obj) {
      if (obj.id == id)
        return path;
      for (var key in obj) {
        if (typeof obj[key] == 'object') {
          let foundPath = this.pathForIdInner_(path.concat([key]), obj[key], id);
          if (foundPath)
            return foundPath;
        }
      }
    }
    return null;
  }
}
