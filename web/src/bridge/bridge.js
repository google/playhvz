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
  listenToDatabase(...args) {
    return this.inner.listenToDatabase(...args);
  }
  listenToGameAsAdmin(...args) {
    return this.inner.listenToGameAsAdmin(...args);
  }
  listenToGameAsPlayer(...args) {
    return this.inner.listenToGameAsPlayer(...args);
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
  newLifeId(note) { return this.generateId('life', note); }
  verifyLifeId(id) { return this.verify('life', id); }
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
  newPlayerId(note) { return this.generateId('player', note); }
  verifyPlayerId(id) { return this.verify('player', id); }
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
    playerId: '?PlayerId',
  });

  // Games
  serverMethods.set('createGame', {
    gameId: '!GameId',
    adminUserId: 'UserId',
    name: 'String',
    rulesHtml: 'String',
    faqHtml: 'String',
    stunTimer: 'Number',
    active: 'Boolean',
    startTime: 'Timestamp',
    endTime: 'Timestamp',
    registrationEndTime: 'Timestamp',
  });
  serverMethods.set('updateGame', {
    gameId: 'GameId',
    name: '|String',
    rulesHtml: '|String',
    faqHtml: '|String',
    stunTimer: '|Number',
    active: '|Boolean',
    startTime: '|Timestamp',
    endTime: '|Timestamp',
    registrationEndTime: '|Timestamp',
  });
  serverMethods.set('setAdminContact', {
    gameId: 'GameId',
    playerId: 'PlayerId',
  });
  serverMethods.set('addDefaultProfileImage', {
    gameId: 'GameId',
    defaultProfileImageId: '!DefaultProfileImageId',
    allegianceFilter: 'String',
    profileImageUrl: 'String',
  });

  // Players
  serverMethods.set('createPlayer', {
    playerId: '!PlayerId',
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
    active: 'Boolean',
    gotEquipment: 'Boolean',
    notes: 'String',
  });
  serverMethods.set('updatePlayer', {
    playerId: 'PlayerId',
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
    active: '|Boolean',
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

  serverMethods.set('selfInfect', {required: {playerId: 'PlayerId'}});

  serverMethods.set('createGroup', {
    groupId: '!GroupId',
    gameId: 'GameId',
    name: 'String',
    allegianceFilter: 'String',
    ownerPlayerId: '?PlayerId',
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
    ownerPlayerId: '|?PlayerId',
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
    playerId: 'PlayerId',
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
    playerId: 'PlayerId',
    timestamp: 'Timestamp',
  });
  serverMethods.set('updateChatRoomMembership', {
    gameId: 'GameId',
    serverTime: '|Timestamp',
    chatRoomId: 'ChatRoomId',
    actingPlayerId: 'PlayerId',
    visible: '|Boolean',
  });

  serverMethods.set('createMap', {
    gameId: 'GameId',
    mapId: '!MapId',
    accessGroupId: 'GroupId',
    name: 'String',
  });
  serverMethods.set('updateMap', {
    gameId: 'GameId',
    mapId: 'MapId',
    name: 'String',
  });

  serverMethods.set('addMarker', {
    markerId: '!MarkerId',
    mapId: 'MapId',
    name: 'String',
    playerId: '?PlayerId',
    color: 'String',
    latitude: 'Number',
    longitude: 'Number',
  });

  serverMethods.set('addPlayerToGroup', {
    gameId: 'GameId',
    groupId: 'GroupId',
    playerToAddId: 'PlayerId',
    actingPlayerId: '?PlayerId',
  });

  serverMethods.set('removePlayerFromGroup', {
    gameId: 'GameId',
    groupId: 'GroupId',
    playerToRemoveId: 'PlayerId',
    actingPlayerId: '?PlayerId',
  });

  serverMethods.set('addAdmin', {
    gameId: 'GameId',
    userId: 'UserId',
  });

  serverMethods.set('joinHorde', {
    gameId: 'GameId',
    playerId: 'PlayerId'
  });
  serverMethods.set('joinResistance', {
    gameId: 'GameId',
    playerId: 'PlayerId',
    lifeCode: '?String',
    lifeId: '?!LifeId',
  });

  serverMethods.set('sendChatMessage', {
    gameId: 'GameId',
    messageId: '!MessageId',
    chatRoomId: 'ChatRoomId',
    playerId: 'PlayerId',
    message: 'String',
  });

  serverMethods.set('addRequestCategory', {
    gameId: 'GameId',
    requestCategoryId: '!RequestCategoryId',
    chatRoomId: 'ChatRoomId',
    playerId: 'PlayerId',
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
    playerId: 'PlayerId',
  });

  serverMethods.set('addResponse', {
    gameId: 'GameId',
    requestId: 'RequestId',
    text: '?String',
  });

  serverMethods.set('addLife', {
    gameId: 'GameId',
    playerId: 'PlayerId',
    lifeId: '!LifeId',
    lifeCode: '?String',
  });

  serverMethods.set('infect', {
    gameId: 'GameId',
    infectionId: '!InfectionId',
    infectorPlayerId: '?PlayerId',
    victimLifeCode: '?String',
    victimPlayerId: '?PlayerId',
  });

  serverMethods.set('sendNotification', {
    gameId: 'GameId',
    queuedNotificationId: '!QueuedNotificationId',
    message: 'String',
    previewMessage: 'String',
    site: 'Boolean',
    mobile: 'Boolean',
    vibrate: 'Boolean',
    sound: 'Boolean',
    email: 'Boolean',
    destination: '?String',
    sendTime: '?Timestamp',
    playerId: '?PlayerId',
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
    sound: '|Boolean',
    email: '|Boolean',
    destination: '|String',
    sendTime: '|?Timestamp',
    playerId: '|?PlayerId',
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
    playerId: 'PlayerId',
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