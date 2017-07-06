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

class Bridge {
  constructor(idGenerator, inner) {
    this.inner = inner;

    this.idGenerator = idGenerator;

    this.requestTimeOffset = null;

    for (let [method, expectations] of Bridge.METHODS_MAP) {
      this[method] =
          (args) => {
            args = Utils.copyOf(args);
            if (this.requestTimeOffset != null)
              args.requestTimeOffset = this.requestTimeOffset;
            new Utils.Validator(expectations, this.check_.bind(this)).validate(args);
            assert(this.inner[method]);
            return this.inner[method](args);
          };
    }

    for (let methodName of Utils.getAllFuncNames(idGenerator)) {
      this[methodName] = (...args) => this.idGenerator[methodName](...args);
    }
  }

  setRequestTimeOffset(requestTimeOffset) {
    // Must be in the past
    assert(requestTimeOffset <= 0);

    if (this.requestTimeOffset == null) {
      this.requestTimeOffset = requestTimeOffset;
    } else {
      // Must always be coming closer to the present
      assert(this.requestTimeOffset <= requestTimeOffset);

      this.requestTimeOffset = requestTimeOffset;
    }
  }

  signIn(...args) {
    return this.inner.signIn(...args);
  }
  signOut(...args) {
    return this.inner.signOut(...args);
  }
  getSignedInPromise(...args) {
    return this.inner.getSignedInPromise(...args);
  }
  listenToGame(...args) {
    return this.inner.listenToGame(...args);
  }
  setPlayerId(playerId) {
    return this.inner.setPlayerId(playerId);
  }

  check_(typeName, value) {
    if (typeName.startsWith('!'))
      typeName = typeName.slice(1);
    assert(('verify' + typeName) in this.idGenerator);
    assert(value);

    // Such as Bridge.UserId.verify
    this.idGenerator['verify' + typeName](value);
  }
}

class IdGenerator {
  generateId(type, note) { return Utils.generateId(type, note); }
  verify(type, id) { return id == null || (typeof id == 'string' && id.startsWith(type + '-')); }

  newChatRoomId(note) { return this.generateId('chatRoom', note); }
  verifyChatRoomId(id) { return this.verify('chatRoom', id); }
  newClaimId(note) { return this.generateId('claim', note); }
  verifyClaimId(id) { return this.verify('claim', id); }
  newDefaultProfileImageId(note) { return this.generateId('defaultProfileImage', note); }
  verifyDefaultProfileImageId(id) { return this.verify('defaultProfileImage', id); }
  newGameId(note) { return this.generateId('game', note); }
  verifyGameId(id) { return this.verify('game', id); }
  newGroupId(note) { return this.generateId('group', note); }
  verifyGroupId(id) { return this.verify('group', id); }
  newGunId(note) { return this.generateId('gun', note); }
  verifyGunId(id) { return this.verify('gun', id); }
  newInfectionId(note) { return this.generateId('infection', note); }
  verifyInfectionId(id) { return this.verify('infection', id); }
  newPublicLifeId(note) { return this.generateId('publicLife', note); }
  verifyPublicLifeId(id) { return this.verify('publicLife', id); }
  newPrivateLifeId(note) { return this.generateId('privateLife', note); }
  verifyPrivateLifeId(id) { return this.verify('privateLife', id); }
  newMapId(note) { return this.generateId('map', note); }
  verifyMapId(id) { return this.verify('map', id); }
  newMembershipId(note) { return this.generateId('membership', note); }
  verifyMembershipId(id) { return this.verify('membership', id); }
  newMessageId(note) { return this.generateId('message', note); }
  verifyMessageId(id) { return this.verify('message', id); }
  newMissionId(note) { return this.generateId('mission', note); }
  verifyMissionId(id) { return this.verify('mission', id); }
  newQueuedNotificationId(note) { return this.generateId('queuedNotification', note); }
  verifyQueuedNotificationId(id) { return this.verify('queuedNotification', id); }
  newNotificationId(note) { return this.generateId('notification', note); }
  verifyNotificationId(id) { return this.verify('notification', id); }
  newPublicPlayerId(note) { return this.generateId('publicPlayer', note); }
  verifyPublicPlayerId(id) { return this.verify('publicPlayer', id); }
  newPrivatePlayerId(note) { return this.generateId('privatePlayer', note); }
  verifyPrivatePlayerId(id) { return this.verify('privatePlayer', id); }
  newMarkerId(note) { return this.generateId('marker', note); }
  verifyMarkerId(id) { return this.verify('marker', id); }
  newQuizAnswerId(note) { return this.generateId('quizAnswer', note); }
  verifyQuizAnswerId(id) { return this.verify('quizAnswer', id); }
  newQuizQuestionId(note) { return this.generateId('quizQuestion', note); }
  verifyQuizQuestionId(id) { return this.verify('quizQuestion', id); }
  newRequestId(note) { return this.generateId('request', note); }
  verifyRequestId(id) { return this.verify('request', id); }
  newRequestCategoryId(note) { return this.generateId('requestCategory', note); }
  verifyRequestCategoryId(id) { return this.verify('requestCategory', id); }
  newRewardCategoryId(note) { return this.generateId('rewardCategory', note); }
  verifyRewardCategoryId(id) { return this.verify('rewardCategory', id); }
  newRewardId(note) { return this.generateId('reward', note); }
  verifyRewardId(id) { return this.verify('reward', id); }
  newUserId(note) { return this.generateId('user', note); }
  verifyUserId(id) { return this.verify('user', id); }
}

class FakeIdGenerator extends IdGenerator {
  constructor() {
    super();
    this.idsByType = {};
  }

  generateId(type, note) {
    if (!(type in this.idsByType)) {
      this.idsByType[type] = 1;
    }
    let result = type + "-";
    if (note)
      result += note + "-";
    result += this.idsByType[type]++;
    return result;
  }
}

// Sets Bridge.METHODS_MAP and Bridge.serverMethods
(function() {
  let optional = Utils.Validator.optional;

  let serverMethods = new Map();

  // Users
  serverMethods.set('register', {
    userId: 'String'
  });

  // Guns
  serverMethods.set('addGun', {
    gameId: 'GameId',
    gunId: '!GunId',
    label: 'String',
  });
  serverMethods.set('updateGun', {
    gameId: 'GameId',
    gunId: 'GunId',
    label: '|String',
  });
  serverMethods.set('assignGun', {
    gameId: 'GameId',
    gunId: 'GunId',
    playerId: '?PublicPlayerId',
  });

  // Games
  serverMethods.set('createGame', {
    gameId: '!GameId',
    adminUserId: 'UserId',
    name: 'String',
    rulesHtml: 'String',
    faqHtml: 'String',
    stunTimer: 'Number',
    isActive: 'Boolean',
    startTime: 'Timestamp',
    endTime: 'Timestamp',
    registrationEndTime: 'Timestamp',
    declareResistanceEndTime: 'Timestamp',
    declareHordeEndTime: 'Timestamp',
  });
  serverMethods.set('updateGame', {
    gameId: 'GameId',
    name: '|String',
    rulesHtml: '|String',
    faqHtml: '|String',
    stunTimer: '|Number',
    isActive: '|Boolean',
    startTime: '|Timestamp',
    endTime: '|Timestamp',
    registrationEndTime: '|Timestamp',
    declareResistanceEndTime: '|Timestamp',
    declareHordeEndTime: '|Timestamp',
  });
  serverMethods.set('setAdminContact', {
    gameId: 'GameId',
    playerId: 'PublicPlayerId',
  });
  serverMethods.set('addDefaultProfileImage', {
    gameId: 'GameId',
    defaultProfileImageId: '!DefaultProfileImageId',
    allegianceFilter: 'String',
    profileImageUrl: 'String',
  });

  // Players
  serverMethods.set('createPlayer', {
    playerId: '!PublicPlayerId',
    privatePlayerId: '?!PrivatePlayerId',
    userId: 'UserId',
    gameId: 'GameId',
    name: 'String',
    needGun: 'Boolean',
    canInfect: 'Boolean',
    profileImageUrl: 'String',
    wantToBeSecretZombie: 'Boolean',
    beInPhotos: 'Boolean',
    volunteer: {
      advertising: 'Boolean',
      logistics: 'Boolean',
      communications: 'Boolean',
      moderator: 'Boolean',
      cleric: 'Boolean',
      sorcerer: 'Boolean',
      admin: 'Boolean',
      photographer: 'Boolean',
      chronicler: 'Boolean',
      server: 'Boolean',
      android: 'Boolean',
      ios: 'Boolean',
      client: 'Boolean',
    },
    notificationSettings: {
      vibrate: 'Boolean',
      sound: 'Boolean',
    },
    isActive: 'Boolean',
    gotEquipment: 'Boolean',
    notes: 'String',
  });
  serverMethods.set('updatePlayer', {
    playerId: 'PublicPlayerId',
    gameId: 'GameId',
    name: '|String',
    needGun: '|Boolean',
    canInfect: '|Boolean',
    profileImageUrl: '|String',
    wantToBeSecretZombie: '|Boolean',
    beInPhotos: '|Boolean',
    volunteer: optional({
      advertising: '|Boolean',
      logistics: '|Boolean',
      communications: '|Boolean',
      moderator: '|Boolean',
      cleric: '|Boolean',
      sorcerer: '|Boolean',
      admin: '|Boolean',
      photographer: '|Boolean',
      chronicler: '|Boolean',
      server: '|Boolean',
      android: '|Boolean',
      ios: '|Boolean',
      client: '|Boolean',
    }),
    notificationSettings: optional({
      vibrate: '|Boolean',
      sound: '|Boolean',
    }),
    isActive: '|Boolean',
    gotEquipment: '|Boolean',
    notes: '|String',
  });


  serverMethods.set('addMission', {
    missionId: '!MissionId',
    accessGroupId: 'GroupId',
    rsvpersGroupId: 'GroupId',
    gameId: 'GameId',
    beginTime: 'Timestamp',
    endTime: 'Timestamp',
    name: 'String',
    detailsHtml: 'String',
  });
  serverMethods.set('updateMission', {
    missionId: 'MissionId',
    gameId: 'GameId',
    accessGroupId: '|GroupId',
    beginTime: '|Timestamp',
    endTime: '|Timestamp',
    name: '|String',
    detailsHtml: '|String',
  });
  serverMethods.set('deleteMission', {
    gameId: 'GameId',
    missionId: 'MissionId',
  });

  serverMethods.set('selfInfect', {required: {playerId: 'PublicPlayerId'}});

  serverMethods.set('createGroup', {
    groupId: '!GroupId',
    gameId: 'GameId',
    name: 'String',
    allegianceFilter: 'String',
    ownerPlayerId: '?PublicPlayerId',
    autoAdd: 'Boolean',
    autoRemove: 'Boolean',
    canAddOthers: 'Boolean',
    canRemoveOthers: 'Boolean',
    canAddSelf: 'Boolean',
    canRemoveSelf: 'Boolean',
  });
  serverMethods.set('updateGroup', {
    gameId: 'GameId',
    groupId: 'GroupId',
    name: '|String',
    allegianceFilter: '|String',
    ownerPlayerId: '|?PublicPlayerId',
    autoAdd: '|Boolean',
    autoRemove: '|Boolean',
    canAddOthers: '|Boolean',
    canRemoveOthers: '|Boolean',
    canAddSelf: '|Boolean',
    canRemoveSelf: '|Boolean',
  });

  serverMethods.set('addRewardCategory', {
    rewardCategoryId: '!RewardCategoryId',
    gameId: 'GameId',
    name: 'String',
    points: 'Number',
    badgeImageUrl: '?String',
    shortName: 'String',
    description: 'String',
    limitPerPlayer: 'Number',
  });
  serverMethods.set('updateRewardCategory', {
    rewardCategoryId: 'RewardCategoryId',
    gameId: 'GameId',
    name: '|String',
    points: '|Number',
    badgeImageUrl: '|?String',
    shortName: '|String',
    description: '|String',
    limitPerPlayer: '|Number',
  });

  serverMethods.set('addReward', {
    gameId: 'GameId',
    rewardId: '!RewardId',
    rewardCategoryId: 'RewardCategoryId',
    code: '?String',
  });

  serverMethods.set('addRewards', {
    gameId: 'GameId',
    rewardCategoryId: 'RewardCategoryId',
    count: 'Number',
  });

  serverMethods.set('claimReward', {
    gameId: 'GameId',
    playerId: 'PublicPlayerId',
    rewardCode: 'String',
  });


  serverMethods.set('createChatRoom', {
    chatRoomId: '!ChatRoomId',
    accessGroupId: 'GroupId',
    gameId: 'GameId',
    name: 'String',
    withAdmins: 'Boolean',
  });
  serverMethods.set('updateChatRoom', {
    chatRoomId: 'ChatRoomId',
    gameId: 'GameId',
    name: '|String',
    withAdmins: '|Boolean',
  });
  serverMethods.set('setLastSeenChatTime', {
    gameId: 'GameId',
    chatRoomId: 'ChatRoomId',
    playerId: 'PublicPlayerId',
    timestamp: 'Timestamp',
  });
  serverMethods.set('updateChatRoomMembership', {
    gameId: 'GameId',
    chatRoomId: 'ChatRoomId',
    actingPlayerId: 'PublicPlayerId',
    isVisible: '|Boolean',
  });

  serverMethods.set('createMap', {
    gameId: 'GameId',
    mapId: '!MapId',
    accessGroupId: 'GroupId',
    name: 'String',
    requestTrackingUntil: 'Timestamp',
  });
  serverMethods.set('updateMap', {
    gameId: 'GameId',
    mapId: 'MapId',
    name: '|String',
    requestTrackingUntil: '|Timestamp',
  });

  serverMethods.set('addMarker', {
    markerId: '!MarkerId',
    mapId: 'MapId',
    gameId: 'GameId',
    name: 'String',
    playerId: '?PublicPlayerId',
    color: 'String',
    latitude: 'Number',
    longitude: 'Number',
  });

  serverMethods.set('addPlayerToGroup', {
    gameId: 'GameId',
    groupId: 'GroupId',
    playerToAddId: 'PublicPlayerId',
    actingPlayerId: '?PublicPlayerId',
  });

  serverMethods.set('removePlayerFromGroup', {
    gameId: 'GameId',
    groupId: 'GroupId',
    playerToRemoveId: 'PublicPlayerId',
    actingPlayerId: '?PublicPlayerId',
  });

  serverMethods.set('addAdmin', {
    gameId: 'GameId',
    userId: 'UserId',
  });

  serverMethods.set('joinHorde', {
    gameId: 'GameId',
    playerId: 'PublicPlayerId'
  });
  serverMethods.set('joinResistance', {
    gameId: 'GameId',
    playerId: 'PublicPlayerId',
    lifeCode: '?String',
    lifeId: '?!PublicLifeId',
    privateLifeId: '?!PrivateLifeId',
  });

  serverMethods.set('sendChatMessage', {
    gameId: 'GameId',
    messageId: '!MessageId',
    chatRoomId: 'ChatRoomId',
    playerId: 'PublicPlayerId',
    message: '|String',
    location: optional({
      latitude: 'Number',
      longitude: 'Number',
    }),
  });

  serverMethods.set('addRequestCategory', {
    gameId: 'GameId',
    requestCategoryId: '!RequestCategoryId',
    chatRoomId: 'ChatRoomId',
    playerId: 'PublicPlayerId',
    text: 'String',
    type: 'String',
    dismissed: 'Boolean',
  });

  serverMethods.set('updateRequestCategory', {
    gameId: 'GameId',
    requestCategoryId: 'RequestCategoryId',
    text: '|String',
    dismissed: '|Boolean',
  });

  serverMethods.set('addRequest', {
    gameId: 'GameId',
    requestCategoryId: 'RequestCategoryId',
    requestId: '!RequestId',
    playerId: 'PublicPlayerId',
  });

  serverMethods.set('addResponse', {
    gameId: 'GameId',
    requestId: 'RequestId',
    text: '?String',
  });

  serverMethods.set('addLife', {
    gameId: 'GameId',
    playerId: 'PublicPlayerId',
    lifeId: '!PublicLifeId',
    privateLifeId: '?!PrivateLifeId',
    lifeCode: '?String',
  });

  serverMethods.set('infect', {
    gameId: 'GameId',
    infectionId: '!InfectionId',
    infectorPlayerId: '?PublicPlayerId',
    victimLifeCode: '?String',
    victimPlayerId: '?PublicPlayerId',
  });

  serverMethods.set('sendNotification', {
    gameId: 'GameId',
    queuedNotificationId: '!QueuedNotificationId',
    message: 'String',
    previewMessage: 'String',
    site: 'Boolean',
    mobile: 'Boolean',
    vibrate: 'Boolean',
    sound: '?String',
    email: 'Boolean',
    destination: '?String',
    sendTime: '?Timestamp',
    playerId: '?PublicPlayerId',
    groupId: '?GroupId',
    icon: '?String',
  });

  serverMethods.set('updateNotification', {
    gameId: 'GameId',
    queuedNotificationId: 'QueuedNotificationId',
    message: '|String',
    previewMessage: '|String',
    site: '|Boolean',
    mobile: '|Boolean',
    vibrate: '|Boolean',
    sound: '|?String',
    email: '|Boolean',
    destination: '|String',
    sendTime: '|?Timestamp',
    playerId: '|?PublicPlayerId',
    groupId: '|?GroupId',
    icon: '|?String',
  });

  serverMethods.set('addQuizQuestion', {
    quizQuestionId: '!QuizQuestionId',
    gameId: 'GameId',
    text: 'String',
    type: 'String',
    number: 'Number',
  });
  serverMethods.set('updateQuizQuestion', {
    quizQuestionId: 'QuizQuestionId',
    gameId: 'GameId',
    text: '|String',
    type: '|String',
    number: '|Number',
  });

  serverMethods.set('addQuizAnswer', {
    gameId: 'GameId',
    quizAnswerId: '!QuizAnswerId',
    quizQuestionId: 'QuizQuestionId',
    text: 'String',
    order: 'Number',
    isCorrect: 'Boolean',
    number: 'Number',
  });
  serverMethods.set('updateQuizAnswer', {
    gameId: 'GameId',
    quizAnswerId: 'QuizAnswerId',
    text: '|String',
    order: '|Number',
    isCorrect: '|Boolean',
    number: '|Number',
  });

  serverMethods.set('markNotificationSeen', {
    gameId: 'GameId',
    playerId: 'PublicPlayerId',
    notificationId: 'NotificationId',
  });

  serverMethods.set('executeNotifications', {
  });

  for (let [name, expectations] of serverMethods) {
    serverMethods.set(name, Utils.merge(expectations, {
      requestTimeOffset: '|Number',
    }));
  }

  Bridge.METHODS_MAP = serverMethods;
  Bridge.METHODS = Array.from(serverMethods.keys());
})();