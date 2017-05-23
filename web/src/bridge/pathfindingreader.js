
class PathFindingReader {
  constructor(source) {
    this.source = source;
    assert(this.source.get);
  }
  get(path) {
    return this.source.get(path);
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
  getQuizQuestionPath(gameId, quizQuestionId) {
    assert(gameId);
    assert(typeof quizQuestionId == 'string' || quizQuestionId == null);
    let path = this.getGamePath(gameId).concat(["quizQuestions"]);
    if (quizQuestionId)
      path = path.concat([Utils.findIndexById(this.get(path), quizQuestionId)]);
    return path;
  }
  getQuizAnswerPath(gameId, quizQuestionId, quizAnswerId) {
    assert(gameId);
    assert(quizQuestionId);
    assert(typeof quizAnswerId == 'string' || quizAnswerId == null);
    let path = this.getQuizQuestionPath(gameId, quizQuestionId).concat(["answers"]);
    if (quizAnswerId)
      path = path.concat([Utils.findIndexById(this.get(path), quizAnswerId)]);
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
  getMembershipPath(gameId, groupId, playerId) {
    assert(gameId);
    assert(groupId);
    assert(typeof playerId == 'string' || playerId == null);
    let path = this.getGroupPath(gameId, groupId).concat(["memberships"]);
    if (playerId)
      path = path.concat([Utils.findIndexById(this.get(path), playerId)]);
    return path;
  }
  getPlayerGroupMembershipPath(gameId, playerId, groupId, expect) {
    assert(gameId);
    assert(playerId);
    assert(typeof groupId == 'string' || groupId == null);
    let path = this.getPlayerPath(gameId, playerId).concat(["groupMemberships"]);
    if (groupId)
      path = path.concat([Utils.findIndexById(this.get(path), groupId, expect)]);
    return path;
  }
  getPlayerChatRoomMembershipPath(gameId, playerId, chatRoomId, expect) {
    assert(gameId);
    assert(playerId);
    assert(typeof chatRoomId == 'string' || chatRoomId == null);
    let path = this.getPlayerPath(gameId, playerId).concat(["chatRoomMemberships"]);
    if (chatRoomId)
      path = path.concat([Utils.findIndexById(this.get(path), chatRoomId, expect)]);
    return path;
  }
  getAdminPath(gameId, userId) {
    assert(gameId);
    assert(typeof userId == 'string' || userId == null);
    let path = this.getGamePath(gameId).concat(["admins"]);
    if (userId)
      path = path.concat([Utils.findIndexById(this.get(path), userId)]);
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
  getGroupPath(gameId, groupId) {
    assert(gameId);
    assert(typeof groupId == 'string' || groupId == null);
    let path = this.getGamePath(gameId).concat(["groups"]);
    if (groupId)
      path = path.concat([Utils.findIndexById(this.get(path), groupId)]);
    return path;
  }
  getGroupMembershipPath(gameId, groupId, membershipId) {
    assert(gameId);
    assert(groupId);
    assert(typeof membershipId == 'string' || membershipId == null);
    let path = this.getGroupPath(gameId, groupId).concat(["memberships"]);
    if (membershipId)
      path = path.concat([Utils.findIndexById(this.get(path), membershipId)]);
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
  getMapPath(gameId, mapId) {
    assert(gameId);
    assert(typeof mapId == 'string' || mapId == null);
    let path = this.getGamePath(gameId).concat(["maps"]);
    if (mapId)
      path = path.concat([Utils.findIndexById(this.get(path), mapId)]);
    return path;
  }
  getPointPath(gameId, mapId, pointId) {
    assert(gameId);
    assert(mapId);
    assert(typeof pointId == 'string' || pointId == null);
    let path = this.getMapPath(gameId, mapId).concat(["points"]);
    if (pointId)
      path = path.concat([Utils.findIndexById(this.get(path), pointId)]);
    return path;
  }
  // getChatRoomMembershipPath(gameId, chatRoomId, membershipId) {
  //   assert(gameId);
  //   assert(chatRoomId);
  //   assert(typeof membershipId == 'string' || membershipId == null);
  //   let path = this.getChatRoomPath(gameId, chatRoomId).concat(["memberships"]);
  //   if (membershipId)
  //     path = path.concat([Utils.findIndexById(this.get(path), membershipId)]);
  //   return path;
  // }
  getChatRoomMessagePath(gameId, chatRoomId, messageId) {
    assert(gameId);
    assert(chatRoomId);
    assert(typeof messageId == 'string' || messageId == null);
    let path = this.getChatRoomPath(gameId, chatRoomId).concat(["messages"]);
    if (messageId)
      path = path.concat([Utils.findIndexById(this.get(path), messageId)]);
    return path;
  }
  getRequestPath(gameId, chatRoomId, requestId) {
    assert(gameId);
    assert(chatRoomId);
    assert(typeof requestId == 'string' || requestId == null);
    let path = this.getChatRoomPath(gameId, chatRoomId).concat(["requests"]);
    if (requestId)
      path = path.concat([Utils.findIndexById(this.get(path), requestId)]);
    return path;
  }
  getResponsePath(gameId, chatRoomId, requestId, responseId) {
    assert(gameId);
    assert(chatRoomId);
    assert(requestId);
    assert(typeof responseId == 'string' || responseId == null);
    let path = this.getRequestPath(gameId, chatRoomId, requestId).concat(["responses"]);
    if (responseId)
      path = path.concat([Utils.findIndexById(this.get(path), responseId)]);
    return path;
  }
  getGameIdAndPlayerIdForNotificationId(notificationId) {
    let path = this.pathForId_(notificationId);
    assert(path);
    let gameId = this.source.get(path.slice(0, 2)).id;
    let playerId = this.source.get(path.slice(0, 4)).id;
    return [gameId, playerId];
  }
  getGameIdForNotificationCategoryId(notificationCategoryId) {
    let path = this.pathForId_(notificationCategoryId);
    return this.source.get(path.slice(0, 2)).id;
  }
  getGameIdForRewardCategoryId(rewardCategoryId) {
    let path = this.pathForId_(rewardCategoryId);
    return this.source.get(path.slice(0, 2)).id;
  }
  getGameIdForPlayerId(playerId, expect) {
    let path = this.pathForId_(playerId, expect, ["games"]);
    if (path)
      return this.source.get(path.slice(0, 2)).id;
    else
      return null;
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
  getChatRoomIdForRequestId(requestId, expect) {
    let path = this.pathForId_(requestId);
    return this.source.get(path.slice(0, 4)).id;
  }
  getRequestIdForResponseId(responseId, expect) {
    let path = this.pathForId_(responseId);
    return this.source.get(path.slice(0, 6)).id;
  }
  getGameIdForQuizQuestionId(quizQuestionId, expect) {
    let path = this.pathForId_(quizQuestionId);
    return this.source.get(path.slice(0, 2)).id;
  }
  getGameIdForChatRoomId(chatRoomId) {
    let path = this.pathForId_(chatRoomId);
    return this.source.get(path.slice(0, 2)).id;
  }
  getGameIdForMapId(mapId) {
    let path = this.pathForId_(mapId);
    return this.source.get(path.slice(0, 2)).id;
  }
  getGameIdForGroupId(groupId) {
    let path = this.pathForId_(groupId);
    return this.source.get(path.slice(0, 2)).id;
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

  getPlayer(gameId, playerId) {
    return this.get(["gamesById", gameId, "playersById", playerId]);
  }
}
