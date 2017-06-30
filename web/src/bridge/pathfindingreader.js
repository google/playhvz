
class PathFindingReader {
  constructor(source) {
    this.source = source;
    assert(this.source.get);
  }
  get(path) {
    return this.source.get(path);
  }
  getDefaultProfileImagePath(defaultProfileImageId) {
    assert(typeof defaultProfileImageId == 'string' || defaultProfileImageId == null);
    let path = ["defaultProfileImages"];
    if (defaultProfileImageId)
      path = path.concat([Utils.findIndexById(this.get(path), defaultProfileImageId)]);
    return path;
  }
  getUserPath(userId) {
    assert(typeof userId == 'string' || userId == null);
    let path = ["users"];
    if (userId)
      path = path.concat([Utils.findIndexById(this.get(path), userId)]);
    return path;
  }
  getUserPublicPlayerPath(userPlayerId) {
    assert(userId);
    assert(typeof userPlayerId == 'string' || userPlayerId == null);
    let path = this.getUserPath(userId).concat(["publicPlayers"]);
    if (userPlayerId)
      path = path.concat([Utils.findIndexById(this.get(path), userPlayerId)]);
    return path;
  }
  getGunPath(gunId) {
    assert(typeof gunId == 'string' || gunId == null);
    let path = ["guns"];
    if (gunId)
      path = path.concat([Utils.findIndexById(this.get(path), gunId)]);
    return path;
  }
  getQuizQuestionPath(quizQuestionId) {
    assert(typeof quizQuestionId == 'string' || quizQuestionId == null);
    let path = ["quizQuestions"];
    if (quizQuestionId)
      path = path.concat([Utils.findIndexById(this.get(path), quizQuestionId)]);
    return path;
  }
  getQuizAnswerPath(quizQuestionId, quizAnswerId) {
    assert(quizQuestionId);
    assert(typeof quizAnswerId == 'string' || quizAnswerId == null);
    let path = this.getQuizQuestionPath(quizQuestionId).concat(["answers"]);
    if (quizAnswerId)
      path = path.concat([Utils.findIndexById(this.get(path), quizAnswerId)]);
    return path;
  }
  getPublicPlayerPath(playerId) {
    assert(typeof playerId == 'string' || playerId == null);
    let path = ["players"];
    if (playerId)
      path = path.concat([Utils.findIndexById(this.get(path), playerId)]);
    return path;
  }
  getPrivatePlayerPath(playerId) {
    return this.getPublicPlayerPath(playerId).concat(["private"]);
  }
  getClaimPath(playerId, rewardId) {
    assert(playerId);
    assert(typeof rewardId == 'string' || rewardId == null);
    let path = this.getPublicPlayerPath(playerId).concat(["claims"]);
    if (rewardId)
      path = path.concat([Utils.findIndexById(this.get(path), rewardId)]);
    return path;
  }
  getPublicLifePath(playerId, lifeId) {
    assert(playerId);
    assert(typeof lifeId == 'string' || lifeId == null);
    let path = this.getPublicPlayerPath(playerId).concat(["lives"]);
    if (lifeId)
      path = path.concat([Utils.findIndexById(this.get(path), lifeId)]);
    return path;
  }
  getPrivateLifePath(playerId, lifeId) {
    return this.getPublicLifePath(playerId, lifeId).concat(["private"]);
  }
  getInfectionPath(playerId, infectionId) {
    assert(playerId);
    assert(typeof infectionId == 'string' || infectionId == null);
    let path = this.getPublicPlayerPath(playerId).concat(["infections"]);
    if (infectionId)
      path = path.concat([Utils.findIndexById(this.get(path), infectionId)]);
    return path;
  }
  getNotificationPath(playerId, notificationId) {
    assert(playerId);
    assert(typeof notificationId == 'string' || notificationId == null);
    let path = this.getPrivatePlayerPath(playerId).concat(["notifications"]);
    if (notificationId)
      path = path.concat([Utils.findIndexById(this.get(path), notificationId)]);
    return path;
  }
  getGroupPlayerPath(groupId, playerId, opt_expect) {
    opt_expect = opt_expect !== false;
    assert(groupId);
    assert(typeof playerId == 'string' || playerId == null);
    let path = this.getGroupPath(groupId, opt_expect).concat(["players"]);
    if (!path && !opt_expect)
      return null;
    if (playerId) {
      let index = this.get(path).indexOf(playerId);
      if (index < 0)
        return null;
      path = path.concat([index]);
    }
    return path;
  }
  getPlayerGroupMembershipPath(playerId, groupId, expect) {
    assert(playerId);
    assert(typeof groupId == 'string' || groupId == null);
    let path = this.getPrivatePlayerPath(playerId).concat(["groupMemberships"]);
    if (groupId)
      path = path.concat([Utils.findIndexById(this.get(path), groupId, expect)]);
    return path;
  }
  getPlayerIdForNotificationId(notificationId, expect) {
    let path = this.pathForId_(notificationId, expect);
    if (path)
      return this.source.get(path.slice(0, 4)).id;
    else
      return null;
  }
  getPlayerChatRoomMembershipPath(playerId, chatRoomId, expect) {
    assert(playerId);
    assert(typeof chatRoomId == 'string' || chatRoomId == null);
    let path = this.getPrivatePlayerPath(playerId).concat(["chatRoomMemberships"]);
    if (chatRoomId)
      path = path.concat([Utils.findIndexById(this.get(path), chatRoomId, expect)]);
    return path;
  }
  getPlayerMissionMembershipPath(playerId, missionId, expect) {
    assert(playerId);
    assert(typeof missionId == 'string' || missionId == null);
    let path = this.getPrivatePlayerPath(playerId).concat(["missionMemberships"]);
    if (missionId)
      path = path.concat([Utils.findIndexById(this.get(path), missionId, expect)]);
    return path;
  }
  getAdminPath(userId) {
    assert(typeof userId == 'string' || userId == null);
    let path = ["admins"];
    if (userId)
      path = path.concat([Utils.findIndexById(this.get(path), userId)]);
    return path;
  }
  getMissionPath(missionId) {
    assert(typeof missionId == 'string' || missionId == null);
    let path = ["missions"];
    if (missionId)
      path = path.concat([Utils.findIndexById(this.get(path), missionId)]);
    return path;
  }
  getRewardCategoryPath(rewardCategoryId) {
    assert(typeof rewardCategoryId == 'string' || rewardCategoryId == null);
    let path = ["rewardCategories"];
    if (rewardCategoryId)
      path = path.concat([Utils.findIndexById(this.get(path), rewardCategoryId)]);
    return path;
  }
  getRewardPath(rewardCategoryId, rewardId) {
    assert(rewardCategoryId);
    assert(typeof rewardId == 'string' || rewardId == null);
    let path = this.getRewardCategoryPath(rewardCategoryId).concat(["rewards"]);
    if (rewardId)
      path = path.concat([Utils.findIndexById(this.get(path), rewardId)]);
    return path;
  }
  getQueuedNotificationPath(queuedNotificationId) {
    assert(typeof queuedNotificationId == 'string' || queuedNotificationId == null);
    let path = ["queuedNotifications"];
    if (queuedNotificationId)
      path = path.concat([Utils.findIndexById(this.get(path), queuedNotificationId)]);
    return path;
  }
  getGroupPath(groupId, opt_expect) {
    opt_expect = opt_expect !== false;
    assert(typeof groupId == 'string' || groupId == null);
    let path = ["groups"];
    if (!path && !opt_expect)
      return null;
    if (groupId) {
      let index = Utils.findIndexById(this.get(path), groupId);
      if (index == null)
        return null;
      path = path.concat([index]);
    }
    return path;
  }
  getChatRoomPath(chatRoomId) {
    assert(typeof chatRoomId == 'string' || chatRoomId == null);
    let path = ["chatRooms"];
    if (chatRoomId)
      path = path.concat([Utils.findIndexById(this.get(path), chatRoomId)]);
    return path;
  }
  getMapPath(mapId) {
    assert(typeof mapId == 'string' || mapId == null);
    let path = ["maps"];
    if (mapId)
      path = path.concat([Utils.findIndexById(this.get(path), mapId)]);
    return path;
  }
  getMarkerPath(mapId, markerId) {
    assert(mapId);
    assert(typeof markerId == 'string' || markerId == null);
    let path = this.getMapPath(mapId).concat(["markers"]);
    if (markerId)
      path = path.concat([Utils.findIndexById(this.get(path), markerId)]);
    return path;
  }
  // getChatRoomMembershipPath(chatRoomId, membershipId) {
  //   assert(chatRoomId);
  //   assert(typeof membershipId == 'string' || membershipId == null);
  //   let path = this.getChatRoomPath(chatRoomId).concat(["memberships"]);
  //   if (membershipId)
  //     path = path.concat([Utils.findIndexById(this.get(path), membershipId)]);
  //   return path;
  // }
  getChatRoomMessagePath(chatRoomId, messageId) {
    assert(chatRoomId);
    assert(typeof messageId == 'string' || messageId == null);
    let path = this.getChatRoomPath(chatRoomId).concat(["messages"]);
    if (messageId)
      path = path.concat([Utils.findIndexById(this.get(path), messageId)]);
    return path;
  }
  getRequestCategoryPath(chatRoomId, requestCategoryId) {
    assert(chatRoomId);
    assert(typeof requestCategoryId == 'string' || requestCategoryId == null);
    let path = this.getChatRoomPath(chatRoomId).concat(["requestCategories"]);
    if (requestCategoryId)
      path = path.concat([Utils.findIndexById(this.get(path), requestCategoryId)]);
    return path;
  }
  getRequestPath(chatRoomId, requestCategoryId, requestId) {
    assert(chatRoomId);
    assert(requestCategoryId);
    assert(typeof requestId == 'string' || requestId == null);
    let path = this.getRequestCategoryPath(chatRoomId, requestCategoryId).concat(["requests"]);
    if (requestId)
      path = path.concat([Utils.findIndexById(this.get(path), requestId)]);
    return path;
  }
  getUserIdForPlayerId(playerId, expect) {
    let path = this.pathForId_(playerId, expect, ["users"]);
    if (path)
      return this.source.get(path.slice(0, 2)).id;
    else
      return null;
  }
  getChatRoomIdForMessageId(messageId, expect) {
    let path = this.pathForId_(messageId);
    return this.source.get(path.slice(0, 4)).id;
  }
  getChatRoomIdForRequestCategoryId(requestCategoryId, expect) {
    let path = this.pathForId_(requestCategoryId);
    return this.source.get(path.slice(0, 4)).id;
  }
  getRequestCategoryIdForRequestId(requestId, expect) {
    let path = this.pathForId_(requestId);
    return this.source.get(path.slice(0, 6)).id;
  }

  idExists(id, expect) {
    expect = expect === undefined ? true : false; // Default to expecting
    return this.objForId_(id, expect);
  }
  objForId_(id, expect) {
    assert(id);
    let result = this.objForIdInner_(this.source.get([]), id);
    if (expect)
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
  pathForId_(id, expect, startPath) {
    startPath = startPath || [];
    assert(id);
    let result = this.pathForIdInner_(startPath, this.source.get(startPath), id);
    if (expect)
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
