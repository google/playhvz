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

class ServerError {
  constructor(message) {
    this.message = message;
  }
}

class InvalidRequestError {
  constructor(message) {
    this.message = message;
  }
}

class FakeServer {
  constructor(idGenerator, destination, time) {
    this.idGenerator = idGenerator;

    this.destination = destination;
    this.game = null;
    this.reader = null;
    this.writer = null;

    window.fakeServer = this;
  }

  setupPrivateModelAndReaderAndWriter(game) {
    this.game = game;
    var writer = new SimpleWriter(this.game);
    var mappingWriter = new MappingWriter(writer);
    var teeWriter = new TeeWriter(
        mappingWriter,
        new CloningWriter(this.destination));
    var batchingWriter = new BatchingWriter(teeWriter);
    this.writer = batchingWriter;

    this.reader = new PathFindingReader(new SimpleReader(this.game));
  }

  getTime_(args) {
    let {requestTimeOffset} = args;
    if (!requestTimeOffset)
      requestTimeOffset = 0;
    return new Date().getTime() + requestTimeOffset;
  }
  register(args) {
    let {userId} = args;
    return userId;
  }
  createGame(args) {
    let {gameId, adminUserId} = args;
    let modelGame = new Model.Game(gameId, args);
    this.setupPrivateModelAndReaderAndWriter(modelGame);
    this.writer.set([], modelGame);
    this.addAdmin({userId: adminUserId});
  }
  setAdminContact(args) {
    let {playerId} = args;
    this.writer.set(["adminContactPlayerId"], playerId);
  }
  updateGame(args) {
    for (let argName in args) {
      this.writer.set([argName], args[argName]);
    }
  }
  addAdmin(args) {
    let {userId} = args;
    this.writer.insert(
        this.reader.getAdminPath(null),
        null,
        new Model.Admin(userId, {userId: userId}));
  }
  addDefaultProfileImage(args) {
    let {defaultProfileImageId} = args;
    this.writer.insert(
        this.reader.getDefaultProfileImagePath(null),
        null,
        new Model.DefaultProfileImage(defaultProfileImageId, args)
    );
  }
  createPlayer(args) {
    let {playerId, privatePlayerId, userId} = args;
    let publicPlayerId = playerId;
    let game = this.game;

    if (!privatePlayerId)
      privatePlayerId = this.idGenerator.newPrivatePlayerId();

    let properties = Utils.copyOf(args);
    properties.allegiance = 'undeclared';
    properties.userId = userId;
    properties.canInfect = false;
    properties.points = 0;
    properties.number = 101 + game.players.length;

    let publicPlayer = new Model.PublicPlayer(publicPlayerId, properties);
    publicPlayer.private = new Model.PrivatePlayer(privatePlayerId, properties);

    this.writer.insert(this.reader.getPublicPlayerPath(null), null, publicPlayer);

    this.updateMembershipsOnAllegianceChange(publicPlayerId);
  }
  createGroup(args) {
    let {groupId} = args;
    new Model.Group(groupId, args).initialize({}, this.game, this.writer);
  }
  updateGroup(args) {
    throwError('Implement!');
  }
  setLastSeenChatTime(args) {
    throwError('Implement!');
  }
  createMap(args) {
    let {mapId} = args;
    this.writer.insert(
        this.reader.getMapPath(null),
        null,
        new Model.Map(mapId, args));
  }
  updateMap(args) {
    throwError('Implement!');
  }
  addMarker(args) {
    let {markerId, mapId} = args;
    this.writer.insert(
        this.reader.getMarkerPath(mapId, null),
        null,
        new Model.Marker(markerId, args));
  }
  createChatRoom(args) {
    let {chatRoomId, accessGroupId} = args;
    this.writer.insert(
        this.reader.getChatRoomPath(null),
        null,
        new Model.ChatRoom(chatRoomId, args));
    let group = this.game.groupsById[accessGroupId];
    for (let playerId of group.players) {
      this.addPlayerToChatRoom_(chatRoomId, playerId);
    }
  }
  updateChatRoom(args) {
    throwError('Implement!');
  }
  updatePlayer(args) {
    let {playerId} = args;
    for (let argName in args) {
      if (Model.PUBLIC_PLAYER_PROPERTIES.includes(argName)) {
        this.writer.set(
            this.reader.getPublicPlayerPath(playerId).concat([argName]),
            args[argName]);
      }
    }
    for (let argName in args) {
      if (Model.PRIVATE_PLAYER_PROPERTIES.includes(argName)) {
        this.writer.set(
            this.reader.getPrivatePlayerPath(playerId).concat([argName]),
            args[argName]);
      }
    }
  }

  addPlayerToGroup(args) {
    let {groupId, playerToAddId} = args;
    let game = this.game;
    let player = game.playersById[playerToAddId];
    let group = game.groupsById[groupId];

    let existingMembership = group.playersById[playerToAddId];
    if (existingMembership)
      return;

    if (group.allegianceFilter != 'none' && group.allegianceFilter != player.allegiance)
      throw new InvalidRequestError('Player does not satisfy this group\'s allegiance filter!');

    this.writer.insert(
        this.reader.getGroupPlayerPath(groupId, null),
        null,
        playerToAddId);

    for (let chatRoom of game.chatRooms) {
      if (chatRoom.accessGroupId == groupId) {
        this.addPlayerToChatRoom_(chatRoom.id, playerToAddId);
      }
    }
    for (let mission of game.missions) {
      if (mission.accessGroupId == groupId) {
        this.addPlayerToMission_(mission.id, playerToAddId);
      }
    }
  }

  removePlayerFromGroup(args) {
    let {groupId, playerToRemoveId} = args;
    let playerId = playerToRemoveId;
    let game = this.game;
    let player = game.playersById[playerId];
    let group = game.groupsById[groupId];

    let existingMembership = group.playersById[playerId];
    if (!existingMembership)
      return;

    if (playerId == group.ownerPlayerId) {
      this.switchGroupOwnership(playerId, group, game)
    }

    for (let chatRoom of game.chatRooms) {
      if (chatRoom.accessGroupId == groupId) {
        this.removePlayerFromChatRoom_(chatRoom.id, player.id);
      }
    }

    for (let mission of game.missions) {
      if (mission.accessGroupId == groupId) {
        this.removePlayerFromMission_(mission.id, player.id);
      }
    }

    let membershipPath = this.reader.getGroupPlayerPath(groupId, playerId);
    this.writer.remove(
        membershipPath.slice(0, membershipPath.length - 1),
        membershipPath.slice(-1)[0], // index
        playerId);
  }

  addPlayerToChatRoom_(chatRoomId, playerId) {
    // Assumes already added to group
    this.writer.insert(
        this.reader.getPlayerChatRoomMembershipPath(playerId, null),
        null,
        new Model.PlayerChatRoomMembership(chatRoomId, {chatRoomId: chatRoomId, isVisible: true}));
  }

  addPlayerToMission_(missionId, playerId) {
    // Assumes already added to group
    this.writer.insert(
        this.reader.getPlayerMissionMembershipPath(playerId, null),
        null,
        new Model.PlayerMissionMembership(missionId, {missionId: missionId}));
  }

  removePlayerFromChatRoom_(chatRoomId, playerId) {
    // Assumes still in the group, and will be removed after this call
    let playerChatRoomMembershipPath = this.reader.getPlayerChatRoomMembershipPath(playerId, chatRoomId);
    this.writer.remove(
        playerChatRoomMembershipPath.slice(0, playerChatRoomMembershipPath.length - 1),
        playerChatRoomMembershipPath.slice(-1)[0],
        chatRoomId);
  }

  removePlayerFromMission_(missionId, playerId) {
    // Assumes still in the group, and will be removed after this call
    let playerMissionMembershipPath = this.reader.getPlayerMissionMembershipPath(playerId, missionId);
    this.writer.remove(
        playerMissionMembershipPath.slice(0, playerMissionMembershipPath.length - 1),
        playerMissionMembershipPath.slice(-1)[0],
        missionId);
  }

  getMessageTargets(message, group) {
    let notificationPlayerIds = [];
    let ackRequestPlayerIds = [];
    let textRequestPlayerIds = [];
    
    while (true) {
      let ackRequestRegex = /@(\?|!)?(\w+)\b\s*/;
      let messageMatch = message.match(ackRequestRegex);
      if (!messageMatch) {
        break;
      }
      message = message.replace(messageMatch[0], "");

      let newTargetPlayerIds = [];
      let playerName = messageMatch[2];
      if (playerName == 'all') {
        newTargetPlayerIds = group.players.slice();
      } else {
        let player = this.game.players.find(player => player.name.toLowerCase() == playerName.toLowerCase());
        if (!player) {
          throw "Couldn't find a player by the name '" + playerName + "'!";
        }
        newTargetPlayerIds = [player.id];
      }

      notificationPlayerIds = notificationPlayerIds.concat(newTargetPlayerIds);
      if (messageMatch[1] == '!') {
        ackRequestPlayerIds = ackRequestPlayerIds.concat(newTargetPlayerIds);
      } else if (messageMatch[1] == '?') {
        textRequestPlayerIds = textRequestPlayerIds.concat(newTargetPlayerIds);
      }
    }

    return [message, notificationPlayerIds, ackRequestPlayerIds, textRequestPlayerIds];
  }

  sendChatMessage(args) {
    let {chatRoomId, playerId, messageId, message} = args;

    let game = this.game;
    let player = game.playersById[playerId];
    let chatRoom = game.chatRoomsById[chatRoomId];
    let group = game.groupsById[chatRoom.accessGroupId];

    if (group.playersById[player.id]) {
      this.writer.insert(
          this.reader.getChatRoomPath(chatRoomId).concat(["messages"]),
          null,
          new Model.Message(messageId, Utils.merge(args, {
            time: this.getTime_(args),
            playerId: playerId,
          })));
    } else {
      throw new InvalidRequestError('Can\'t send message to chat room without membership');
    }

    let [strippedMessage, notificationPlayerIds, ackRequestPlayerIds, textRequestPlayerIds] =
        this.getMessageTargets(message, group);

    if (notificationPlayerIds.length) {
      for (let receiverPlayerId of notificationPlayerIds) {
        let receiverPlayer = this.game.playersById[receiverPlayerId];
        let messageForNotification = player.name + ": " + strippedMessage;
        this.addNotification({
          playerId: receiverPlayerId,
          notificationId: this.idGenerator.newNotificationId(),
          queuedNotificationId: null,
          message: messageForNotification,
          previewMessage: messageForNotification,
          destination: 'chat/' + chatRoom.id,
          time: this.getTime_(args),
          icon: null,
        });
      }
    }
    if (ackRequestPlayerIds.length) {
      this.sendRequests(chatRoomId, playerId, 'ack', strippedMessage, ackRequestPlayerIds);
    }
    if (textRequestPlayerIds.length) {
      this.sendRequests(chatRoomId, playerId, 'text', strippedMessage, textRequestPlayerIds);
    }
  }

  sendRequests(chatRoomId, senderPlayerId, type, message, playerIds) {
    let requestCategoryId = this.idGenerator.newRequestCategoryId();
    this.addRequestCategory({
      requestCategoryId: requestCategoryId,
      chatRoomId: chatRoomId,
      playerId: senderPlayerId,
      text: message,
      type: type,
      dismissed: false,
    });
    for (let playerId of playerIds) {
      this.addRequest({
        requestCategoryId: requestCategoryId,
        requestId: this.idGenerator.newRequestId(),
        playerId: playerId,
      });
    }
  }

  updateChatRoomMembership(args) {
    let {chatRoomId, actingPlayerId} = args;
    let playerId = actingPlayerId;
    let game = this.game;
    let player = game.playersById[playerId];

    let playerChatRoomMembershipPath = this.reader.getPlayerChatRoomMembershipPath(playerId, chatRoomId);

    for (let argName in args) {
      this.writer.set(
          playerChatRoomMembershipPath.concat([argName]),
          args[argName]);
    }
  }

  addRequestCategory(args) {
    let {requestCategoryId, chatRoomId} = args;
    this.writer.insert(
        this.reader.getRequestCategoryPath(chatRoomId, null),
        null,
        new Model.RequestCategory(requestCategoryId, Utils.merge(args, {
          time: this.getTime_(args),
        })));
  }

  updateRequestCategory(args) {
    let {requestCategoryId} = args;
    let chatRoomId = this.reader.getChatRoomIdForRequestCategoryId(requestCategoryId);
    let requestCategoryPath = this.reader.getRequestCategoryPath(chatRoomId, requestCategoryId);
    for (let argName in args) {
      this.writer.set(requestCategoryPath.concat([argName]), args[argName]);
    }
  }
  
  addRequest(args) {
    let {requestId, requestCategoryId, playerId} = args;
    let chatRoomId = this.reader.getChatRoomIdForRequestCategoryId(requestCategoryId);
    this.writer.insert(
        this.reader.getRequestPath(chatRoomId, requestCategoryId, null),
        null,
        new Model.Request(requestId, {
          playerId: playerId,
          time: null,
          text: null,
        }));
  }

  addResponse(args) {
    let {requestId, text} = args;
    let requestCategoryId = this.reader.getRequestCategoryIdForRequestId(requestId);
    let chatRoomId = this.reader.getChatRoomIdForMessageId(requestId);
    let requestCategory = this.reader.get(this.reader.getRequestCategoryPath(chatRoomId, requestCategoryId));
    let requestPath = this.reader.getRequestPath(chatRoomId, requestCategoryId, requestId);
    let request = this.reader.get(requestPath);
    if (requestCategory.type == 'ack')
      assert(text === null);
    else if (requestCategory.type == 'text')
      assert(typeof text == 'string' && text);
    else
      throwError('Bad request type');
    this.writer.set(requestPath.concat(["response"]), {
      time: this.getTime_(args),
      text: text
    });
  }

  addMission(args) {
    let {missionId, accessGroupId} = args;
    this.writer.insert(
        this.reader.getMissionPath(null),
        null,
        new Model.Mission(missionId, args));
    this.addMissionMembershipsForAllGroupMembers_(missionId, accessGroupId);
  }

  addMissionMembershipsForAllGroupMembers_(missionId, accessGroupId) {
    let group = this.game.groupsById[accessGroupId];
    for (let playerId of group.players) {
      this.addPlayerToMission_(missionId, playerId);
    }
  }

  removeMissionMembershipsForAllGroupMembers_(missionId, accessGroupId) {
    let group = this.game.groupsById[accessGroupId];
    for (let playerId of group.players) {
      this.removePlayerFromMission_(missionId, playerId);
    }
  }

  updateMission(args) {
    let {missionId} = args;
    let missionPath = this.reader.getMissionPath(missionId);
    let mission = this.game.missionsById[missionId];
    if ('accessGroupId' in args) {
      this.removeMissionMembershipsForAllGroupMembers_(missionId, mission.accessGroupId);
      this.addMissionMembershipsForAllGroupMembers_(missionId, args.accessGroupId);
    }
    for (let argName in args) {
      this.writer.set(missionPath.concat([argName]), args[argName]);
    }
  }
  deleteMission(args) {
    let {missionId} = args;
    let missionPath = this.reader.getMissionPath(missionId);
    let mission = this.game.missionsById[missionId];
    this.removeMissionMembershipsForAllGroupMembers_(missionId, mission.accessGroupId);
    this.writer.remove(
        missionPath.slice(0, missionPath.length - 1),
        missionPath.slice(-1)[0], // index
        missionId);
  }
  addRewardCategory(args) {
    let {rewardCategoryId} = args;
    this.writer.insert(
        this.reader.getRewardCategoryPath(null),
        null,
        new Model.RewardCategory(rewardCategoryId, args));
  }
  updateRewardCategory(args) {
    let {rewardCategoryId} = args;
    let rewardCategoryPath = this.reader.getRewardCategoryPath(rewardCategoryId);
    for (let argName in args) {
      this.writer.set(rewardCategoryPath.concat([argName]), args[argName]);
    }
  }
  updateNotification(args) {
    this.updateQueuedNotification(args);
  }
  sendNotification(args) {
    this.addQueuedNotification(args);
    let millisecondsUntilSend = args.sendTime - this.getTime_(args);
    if (millisecondsUntilSend > 0) {
      setTimeout(
          () => this.executeNotifications(args),
          millisecondsUntilSend);
    } else {
      this.executeNotifications(args);
    }
  }
  executeNotifications(args) {
    let game = this.game;
    for (let queuedNotification of game.queuedNotifications) {
      if (!queuedNotification.sent && (queuedNotification.sendTime == null || queuedNotification.sendTime <= this.getTime_(args))) {
        this.writer.set(this.reader.getQueuedNotificationPath(queuedNotification.id).concat(['sent']), true);

        let playerIds = new Set();
        if (queuedNotification.playerId) {
          playerIds.add(queuedNotification.playerId);
        } else {
          assert(queuedNotification.groupId);
          let group = game.groupsById[queuedNotification.groupId];
          playerIds = new Set(group.players);
        }
        for (let playerId of playerIds) {
          this.addNotification({
            playerId: playerId,
            notificationId: this.idGenerator.newNotificationId(),
            queuedNotificationId: queuedNotification.id,
            message: queuedNotification.message,
            previewMessage: queuedNotification.previewMessage,
            destination: queuedNotification.destination,
            time: this.getTime_(args),
            icon: queuedNotification.icon,
          });
        }
      }
    }
  }
  addQueuedNotification(args) {
    let {queuedNotificationId} = args;
    args.sent = false;
    this.writer.insert(
        this.reader.getQueuedNotificationPath(null),
        null,
        new Model.QueuedNotification(queuedNotificationId, args));
  }
  addNotification(args) {
    let {queuedNotificationId, notificationId, playerId} = args;
    let properties = Utils.copyOf(args);
    properties.seenTime = null;
    properties.queuedNotificationId = queuedNotificationId;
    properties.time = this.getTime_(args);
    this.writer.insert(
        this.reader.getNotificationPath(playerId, null),
        null,
        new Model.Notification(notificationId, properties));
  }
  updateQueuedNotification(args) {
    let {queuedNotificationId} = args;
    let queuedNotificationPath = this.reader.getQueuedNotificationPath(queuedNotificationId);
    for (let argName in args) {
      this.writer.set(queuedNotificationPath.concat([argName]), args[argName]);
    }
  }
  markNotificationSeen(args) {
    let {playerId, notificationId} = args;
    this.writer.set(
        this.reader.getNotificationPath(playerId, notificationId).concat(["seenTime"]),
        this.getTime_(args));
  }
  addReward(args) {
    let {rewardCategoryId, rewardId, code} = args;
    let rewardCategory = this.game.rewardCategoriesById[rewardCategoryId];
    code = code || rewardCategory.shortName + ' ' + rewardCategory.rewards.length;
    this.writer.insert(
        this.reader.getRewardPath(rewardCategoryId, null),
        null,
        new Model.Reward(rewardId, Utils.merge(args, {
          code: code,
          rewardCategoryId: rewardCategoryId,
          playerId: null,
        })));
  }
  addRewards(args) {
    let {rewardCategoryId, count} = args;
    let rewardCategory = this.game.rewardCategoriesById[rewardCategoryId];
    for (let i = 0; i < count; i++) {
      let rewardId = this.idGenerator.newRewardId();
      let code = rewardCategory.shortName + ' ' + rewardCategory.rewards.length;
      this.addReward({
        id: rewardId,
        rewardId: rewardId,
        rewardCategoryId: rewardCategoryId,
        code: code
      });
    }
  }
  addGun(args) {
    let {gunId, label} = args;
    let properties = {
      id: gunId,
      label: label,
      playerId: null,
    };
    this.writer.insert(
        this.reader.getGunPath(null),
        null,
        properties);
  }
  updateGun(args) {
    let {gunId} = args;
    for (let argName in args) {
      this.writer.set(
          this.reader.getGunPath(gunId).concat([argName]),
          args[argName]);
    }
  }
  assignGun(args) {
    let {gunId, playerId} = args;
    let gunPath = this.reader.getGunPath(gunId);
    this.writer.set(gunPath.concat(["playerId"]), playerId);
  }
  claimReward({playerId, rewardCode}) {
    assert(typeof rewardCode == 'string');
    rewardCode = rewardCode.replace(/\s/g, '').toLowerCase();
    // let playerPath = this.reader.pathForId(playerId);
    // let gamePath = playerPath.slice(0, 2);
    let game = this.game;
    let player = game.playersById[playerId];

    // let rewardCategoriesPath = gamePath.concat(["rewardCategories"]);
    for (let i = 0; i < game.rewardCategories.length; i++) {
      let rewardCategory = game.rewardCategories[i];
      for (let j = 0; j < rewardCategory.rewards.length; j++) {
        let reward = rewardCategory.rewards[j];
        if (reward.code.replace(/\s/g, '').toLowerCase() == rewardCode) {
          this.writer.set(
              this.reader.getRewardPath(rewardCategory.id, reward.id).concat(["playerId"]),
              playerId);
          this.writer.set(
              this.reader.getPublicPlayerPath(player.id).concat(["points"]),
              player.points + rewardCategory.points);
          this.writer.insert(
              this.reader.getClaimPath(playerId, null),
              null,
              new Model.Claim(this.idGenerator.newClaimId(), {
                rewardCategoryId: rewardCategory.id,
                rewardId: reward.id,
              }));
          return rewardCategory.id;
        }
      }
    }
    assert(false);
  }
  selfInfect(args) {
    let {playerId} = args;
    this.setPlayerZombie(playerId);
    this.setValidCode(this.reader.getPublicPlayerPath(playerId), true);
  }
  setValidCode(path, value) {
    this.writer.set(path.concat(["validCode"]), value);
  } 
  joinResistance(args) {
    let {playerId, lifeId, privateLifeId, lifeCode} = args;
    let publicLifeId = lifeId;

    let player = this.reader.get(this.reader.getPublicPlayerPath(playerId));
    assert(player.allegiance == 'undeclared');

    this.addLife(args);
    this.setPlayerHuman(playerId);
  }
  joinHorde(args) {
    let {playerId} = args;
    this.setPlayerZombie(playerId);
  }
  updateMembershipsOnAllegianceChange(playerId) {
    let game = this.game;
    let player = game.playersById[playerId];

    for (let group of this.game.groups) {
      if (group.autoRemove) {
        if (group.allegianceFilter != 'none' && group.allegianceFilter != player.allegiance) {
          if (group.playersById[playerId]) {
            this.removePlayerFromGroup({groupId: group.id, playerToRemoveId: playerId});
          }
        }
      }
    }
    for (let group of this.game.groups) {
      if (group.autoAdd) {
        if (group.allegianceFilter == 'none' || group.allegianceFilter == player.allegiance) {
          this.addPlayerToGroup({groupId: group.id, playerToAddId: playerId});
        }
      }
    }
  }
  switchGroupOwnership(ownerId, group, game) {
    var highestPointCount = -1;
    var highestPlayer = null;
    for (let playerId of group.players) {
      let player = game.playersById[playerId];
      // Find other player in group with most points. Ties go to the player with lower player #
      if (player.userId != ownerId && (player.points > highestPointCount || 
        (player.points == highestPointCount && player.number < highestPlayer.number))) {
        highestPlayer = player;
        highestPointCount = player.points;
      }
    }
    let groupPath = this.reader.getGroupPath(group.groupId, null);
    if (highestPlayer == null) {
      // If there aren't any other people in the group, then make the owner null
      this.writer.set(groupPath.concat(['ownerPlayerId']), null)
    } else {
      // Otherwise, switch ownership to the highest player
      this.writer.set(groupPath.concat(['ownerPlayerId']), highestPlayer.userId)
    }
  }
  setPlayerZombie(playerId) {
    let publicPlayerPath = this.reader.getPublicPlayerPath(playerId);
    this.writer.set(publicPlayerPath.concat(["allegiance"]), "horde");
    let privatePlayerPath = this.reader.getPrivatePlayerPath(playerId);
    this.writer.set(privatePlayerPath.concat(["canInfect"]), true);
    this.updateMembershipsOnAllegianceChange(playerId);
  }
  setPlayerHuman(playerId) {
    let publicPlayerPath = this.reader.getPublicPlayerPath(playerId);
    this.writer.set(publicPlayerPath.concat(["allegiance"]), "resistance");
    let privatePlayerPath = this.reader.getPrivatePlayerPath(playerId);
    this.writer.set(privatePlayerPath.concat(["canInfect"]), false);
    this.updateMembershipsOnAllegianceChange(playerId);
  }
  findPlayerByIdOrLifeCode_(playerId, lifeCode) {
    let players = this.reader.get(this.reader.getPublicPlayerPath(null));
    assert(playerId || lifeCode);
    if (playerId) {
      let player = this.reader.get(this.reader.getPublicPlayerPath(playerId));
      if (!player) {
        throw InvalidRequestError('No player found with id ' + playerId);
      }
      return player;
    } else {
      for (let i = 0; i < players.length; i++) {
        let player = players[i];
        if (player.lives.length) {
          let life = player.lives[player.lives.length - 1];
          if (life.private.code == lifeCode) {
            return player;
          }
        }
      }
      throw new InvalidRequestError('No player found with life code ' + lifeCode);
    }
  }
  infect(request) {
    let {infectionId, infectorPlayerId, victimLifeCode, victimPlayerId} = request;
    let victimPlayer = this.findPlayerByIdOrLifeCode_(victimPlayerId, victimLifeCode);
    victimPlayerId = victimPlayer.id;
    let infectorPlayerPath = this.reader.getPublicPlayerPath(infectorPlayerId);
    let infectorPlayer = this.reader.get(infectorPlayerPath);
    // Self-infection
    if (victimPlayer.allegiance == 'resistance' && 
        infectorPlayer.private &&
        !infectorPlayer.private.canInfect) {
      if (victimPlayerId == infectorPlayerId) {
        this.setPlayerZombie(infectorPlayerId);
        this.setValidCode(infectorPlayerPath, true);
        return "self-infection";
      } else {
        return alert("As a human you cannot infect others.");
      }
    }
    if  (victimPlayer.allegiance == 'resistance' || victimPlayer.validCode == true) {
      // Victim's lifecode is no longer valid
      this.setValidCode(this.reader.getPublicPlayerPath(victimPlayerId), false);
      // Give the infector points
      this.writer.set(
        infectorPlayerPath.concat(["points"]),
        this.reader.get(infectorPlayerPath.concat(["points"])) + 100);
      let victimPrivatePlayerPath = this.reader.getPrivatePlayerPath(victimPlayer.id);
      if (infectorPlayer.allegiance == 'resistance') { //Possessed human infection
        // Possessed human becomes a zombie
        this.addInfection_(request, this.idGenerator.newInfectionId(), infectorPlayerId, infectorPlayerId);
        // Set the infector to zombie
        // Oddity: if the possessed human has some extra lives, they just become regular human. weird!
        if (infectorPlayer.infections.length >= infectorPlayer.lives.length) {
          this.setPlayerZombie(infectorPlayer.id);
        }
        // The victim can now infect
        this.writer.set(victimPrivatePlayerPath.concat(["canInfect"]), true);
    } else { // Normal zombie infection
        // Add an infection to the victim
        this.addInfection_(request, this.idGenerator.newInfectionId(), victimPlayerId, infectorPlayerId);
        // Set the victim to zombie
        if (victimPlayer.infections.length >= victimPlayer.lives.length) {
          this.setPlayerZombie(victimPlayer.id);
        }
      }
    } else {
     throw new InvalidRequestError('The player with this lifecode was already zombified.');
    }
    return victimPlayer.id;
  }

  addInfection_(request, infectionId, infecteePlayerId, infectorPlayerId) {
    let infecteePlayerPath = this.reader.getPublicPlayerPath(infecteePlayerId);
    let infecteePlayer = this.reader.get(infecteePlayerPath);
    let time = this.getTime_(request);

    let latestTime = 0;
    assert(infecteePlayer.lives);
    assert(infecteePlayer.infections);
    for (let life of infecteePlayer.lives)
      latestTime = Math.max(latestTime, life.time);
    for (let infection of infecteePlayer.infections)
      latestTime = Math.max(latestTime, infection.time);
    assert(time > latestTime);

    this.writer.insert(
        infecteePlayerPath.concat(["infections"]),
        null,
        new Model.Infection(infectionId, {
          infectorId: infectorPlayerId,
          time: time,
        }));
  }

  addLife(request) {
    let {lifeId, privateLifeId, playerId, lifeCode} = request;
    let publicLifeId = lifeId;
    let playerPath = this.reader.getPublicPlayerPath(playerId);
    let player = this.reader.get(playerPath);
    let time = this.getTime_(request);
    lifeCode = lifeCode || "codefor-" + player.name;

    let latestTime = 0;
    assert(player.lives);
    assert(player.infections);
    for (let life of player.lives)
      latestTime = Math.max(latestTime, life.time);
    for (let infection of player.infections)
      latestTime = Math.max(latestTime, infection.time);
    assert(time > latestTime);

    publicLifeId = publicLifeId || this.idGenerator.newPublicLifeId();
    privateLifeId = privateLifeId || this.idGenerator.newPrivateLifeId();

    assert(player.lives.length == player.infections.length);
    let publicLife =
        new Model.PublicLife(publicLifeId, {
          privateLifeId: privateLifeId,
          time: this.getTime_(request),
        });
    publicLife.private =
        new Model.PrivateLife(privateLifeId, {
          code: lifeCode
        });
    this.writer.insert(this.reader.getPublicLifePath(playerId, null), null, publicLife);
    if (player.lives.length > player.infections.length) {
      this.setPlayerHuman(playerId);
    }
  }

  updateQuizQuestion(args) {
    throwError('Implement!');
  }
  updateQuizAnswer(args) {
    throwError('Implement!');
  }
  addQuizQuestion(args) {
    let {quizQuestionId} = args;
    this.writer.insert(
        this.reader.getQuizQuestionPath(null),
        null,
        new Model.QuizQuestion(quizQuestionId, args));
  }
  addQuizAnswer(args) {
    let {quizAnswerId, quizQuestionId} = args;
    this.writer.insert(
        this.reader.getQuizAnswerPath(quizQuestionId, null),
        null,
        new Model.QuizAnswer(quizAnswerId, args));
  }
}
