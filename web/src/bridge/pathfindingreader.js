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


class PathFindingReader {
  constructor(source) {
    this.source = source;
    assert(this.source.get);
  }
  get(path) {
    return this.source.get(path);
  }
  getGamePath(gameId, opt_expect) {
    opt_expect = opt_expect !== false;
    assert(typeof gameId == 'string' || gameId == null);
    let path = ["games"];
    if (gameId) {
      let index = Utils.findIndexById(this.get(path), gameId, opt_expect);
      if (index == null)
        return null;
      path = path.concat([index]);
    }
    return path;
  }
  getDefaultProfileImagePath(gameId, defaultProfileImageId) {
    assert(gameId);
    assert(typeof defaultProfileImageId == 'string' || defaultProfileImageId == null);
    let path = this.getGamePath(gameId).concat(["defaultProfileImages"]);
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
  getUserPublicPlayerPath(userId, userPlayerId) {
    assert(userId);
    assert(typeof userPlayerId == 'string' || userPlayerId == null);
    let path = this.getUserPath(userId).concat(["publicPlayers"]);
    if (userPlayerId)
      path = path.concat([Utils.findIndexById(this.get(path), userPlayerId)]);
    return path;
  }
  getGunPath(gameId, gunId) {
    assert(gameId);
    assert(typeof gunId == 'string' || gunId == null);
    let path = this.getGamePath(gameId).concat(["guns"]);
    if (gunId)
      path = path.concat([Utils.findIndexById(this.get(path), gunId)]);
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
  getPublicPlayerPath(gameId, playerId) {
    assert(gameId);
    assert(typeof playerId == 'string' || playerId == null);
    let path = this.getGamePath(gameId).concat(["players"]);
    if (playerId)
      path = path.concat([Utils.findIndexById(this.get(path), playerId)]);
    return path;
  }
  getPrivatePlayerPath(gameId, playerId) {
    return this.getPublicPlayerPath(gameId, playerId).concat(["private"]);
  }
  getClaimPath(gameId, playerId, rewardId) {
    assert(gameId);
    assert(playerId);
    assert(typeof rewardId == 'string' || rewardId == null);
    let path = this.getPublicPlayerPath(gameId, playerId).concat(["claims"]);
    if (rewardId)
      path = path.concat([Utils.findIndexById(this.get(path), rewardId)]);
    return path;
  }
  getPublicLifePath(gameId, playerId, lifeId) {
    assert(gameId);
    assert(playerId);
    assert(typeof lifeId == 'string' || lifeId == null);
    let path = this.getPublicPlayerPath(gameId, playerId).concat(["lives"]);
    if (lifeId)
      path = path.concat([Utils.findIndexById(this.get(path), lifeId)]);
    return path;
  }
  getPrivateLifePath(gameId, playerId, lifeId) {
    return this.getPublicLifePath(gameId, playerId, lifeId).concat(["private"]);
  }
  getInfectionPath(gameId, playerId, infectionId) {
    assert(gameId);
    assert(playerId);
    assert(typeof infectionId == 'string' || infectionId == null);
    let path = this.getPublicPlayerPath(gameId, playerId).concat(["infections"]);
    if (infectionId)
      path = path.concat([Utils.findIndexById(this.get(path), infectionId)]);
    return path;
  }
  getNotificationPath(gameId, playerId, notificationId) {
    assert(gameId);
    assert(playerId);
    assert(typeof notificationId == 'string' || notificationId == null);
    let path = this.getPrivatePlayerPath(gameId, playerId).concat(["notifications"]);
    if (notificationId)
      path = path.concat([Utils.findIndexById(this.get(path), notificationId)]);
    return path;
  }
  getGroupPlayerPath(gameId, groupId, playerId, opt_expect) {
    opt_expect = opt_expect !== false;
    assert(gameId);
    assert(groupId);
    assert(typeof playerId == 'string' || playerId == null);
    let path = this.getGroupPath(gameId, groupId, opt_expect).concat(["players"]);
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
  getPlayerGroupMembershipPath(gameId, playerId, groupId, expect) {
    assert(gameId);
    assert(playerId);
    assert(typeof groupId == 'string' || groupId == null);
    let path = this.getPrivatePlayerPath(gameId, playerId).concat(["groupMemberships"]);
    if (groupId)
      path = path.concat([Utils.findIndexById(this.get(path), groupId, expect)]);
    return path;
  }
  getPlayerIdForNotificationId(gameId, notificationId, expect) {
    let path = this.pathForId_(notificationId, expect);
    if (path)
      return this.source.get(path.slice(0, 4)).id;
    else
      return null;
  }
  getPlayerChatRoomMembershipPath(gameId, playerId, chatRoomId, expect) {
    assert(gameId);
    assert(playerId);
    assert(typeof chatRoomId == 'string' || chatRoomId == null);
    let path = this.getPrivatePlayerPath(gameId, playerId).concat(["chatRoomMemberships"]);
    if (chatRoomId)
      path = path.concat([Utils.findIndexById(this.get(path), chatRoomId, expect)]);
    return path;
  }
  getPlayerMissionMembershipPath(gameId, playerId, missionId, expect) {
    assert(gameId);
    assert(playerId);
    assert(typeof missionId == 'string' || missionId == null);
    let path = this.getPrivatePlayerPath(gameId, playerId).concat(["missionMemberships"]);
    if (missionId)
      path = path.concat([Utils.findIndexById(this.get(path), missionId, expect)]);
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
  getQueuedNotificationPath(gameId, queuedNotificationId) {
    assert(gameId);
    assert(typeof queuedNotificationId == 'string' || queuedNotificationId == null);
    let path = this.getGamePath(gameId).concat(["queuedNotifications"]);
    if (queuedNotificationId)
      path = path.concat([Utils.findIndexById(this.get(path), queuedNotificationId)]);
    return path;
  }
  getGroupPath(gameId, groupId, opt_expect) {
    opt_expect = opt_expect !== false;
    assert(gameId);
    assert(typeof groupId == 'string' || groupId == null);
    let path = this.getGamePath(gameId, opt_expect).concat(["groups"]);
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
  getMarkerPath(gameId, mapId, markerId) {
    assert(gameId);
    assert(mapId);
    assert(typeof markerId == 'string' || markerId == null);
    let path = this.getMapPath(gameId, mapId).concat(["markers"]);
    if (markerId)
      path = path.concat([Utils.findIndexById(this.get(path), markerId)]);
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
  getRequestCategoryPath(gameId, chatRoomId, requestCategoryId) {
    assert(gameId);
    assert(chatRoomId);
    assert(typeof requestCategoryId == 'string' || requestCategoryId == null);
    let path = this.getChatRoomPath(gameId, chatRoomId).concat(["requestCategories"]);
    if (requestCategoryId)
      path = path.concat([Utils.findIndexById(this.get(path), requestCategoryId)]);
    return path;
  }
  getRequestPath(gameId, chatRoomId, requestCategoryId, requestId) {
    assert(gameId);
    assert(chatRoomId);
    assert(requestCategoryId);
    assert(typeof requestId == 'string' || requestId == null);
    let path = this.getRequestCategoryPath(gameId, chatRoomId, requestCategoryId).concat(["requests"]);
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

  getPlayer(gameId, playerId) {
    return this.get(["gamesById", gameId, "playersById", playerId]);
  }
}
