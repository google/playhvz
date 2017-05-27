'use strict';

class Bridge {
  constructor(idGenerator, inner) {
    this.inner = inner;

    this.idGenerator = idGenerator;

    for (let [method, expectations] of Bridge.METHODS_MAP) {
      this[method] =
          (...args) => {
            Utils.checkObject(
                args[0],
                expectations.required,
                expectations.optional,
                this.check_.bind(this));
            assert(this.inner[method]);
            return this.inner[method](...args);
          };
    }

    for (let methodName of Utils.getAllFuncNames(idGenerator)) {
      this[methodName] = (...args) => this.idGenerator[methodName](...args);
    }
  }

  attemptAutoSignIn() {
    return this.inner.attemptAutoSignIn();
  }

  listenToGameAsAdmin(...args) {
    return this.inner.listenToGameAsAdmin(...args);
  }
  listenToGameAsNonAdmin(...args) {
    return this.inner.listenToGameAsNonAdmin(...args);
  }

  check_(typeName, value) {
    if (typeName.startsWith("?")) {
      if (value === null)
        return true;
      typeName = typeName.slice(1); // Example "?UserId" to UserId
    }
    if (typeName == 'Boolean')
      return Utils.isBoolean(value);
    if (typeName == 'String')
      return Utils.isString(value);
    if (typeName == 'Number')
      return Utils.isNumber(value);
    if (typeName == 'TimestampMs')
      return Utils.isTimestampMs(value);
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
  verify(type, id) { return id.startsWith(type + '-'); }

  newChatRoomId(note) { return this.generateId('chatRoom', note); }
  verifyChatRoomId(id) { return this.verify('chatRoom', id); }
  newClaimId(note) { return this.generateId('claim', note); }
  verifyClaimId(id) { return this.verify('claim', id); }
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
  newNotificationCategoryId(note) { return this.generateId('notification', note); }
  verifyNotificationCategoryId(id) { return this.verify('notification', id); }
  newNotificationId(note) { return this.generateId('notification', note); }
  verifyNotificationId(id) { return this.verify('notification', id); }
  newPlayerId(note) { return this.generateId('player', note); }
  verifyPlayerId(id) { return this.verify('player', id); }
  newPointId(note) { return this.generateId('point', note); }
  verifyPointId(id) { return this.verify('point', id); }
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
  let serverMethods = new Map();

  serverMethods.set('setTimeOffset', {
    required: {offsetMs: 'Number'},
  });

  // Users
  serverMethods.set('signIn', {});
  serverMethods.set('register', {
    required: {userId: '!UserId', name: 'String'}
  });

  // Guns
  serverMethods.set('addGun', {
    required: {
      gunId: '!GunId',
    }
  });
  serverMethods.set('assignGun', {
    required: {
      gunId: 'GunId',
      playerId: '?PlayerId',
    },
  });

  // Games
  const GAME_PROPERTIES = {
    name: 'String',
    rulesHtml: 'String',
    stunTimer: 'Number',
    active: 'Boolean',
  };
  serverMethods.set('createGame', {
    required: Utils.merge({gameId: '!GameId', adminUserId: 'UserId'}, GAME_PROPERTIES),
  });
  serverMethods.set('updateGame', {
    required: {gameId: 'GameId'},
    optional: GAME_PROPERTIES,
  });
  serverMethods.set('setAdminContact', {
    required: {gameId: 'GameId', playerId: 'PlayerId'},
  });

  // Players
  const PLAYER_PROPERTIES = {
    name: 'String',
    needGun: 'Boolean',
    canInfect: 'Boolean',
    profileImageUrl: 'String',
    startAsZombie: 'String',
    beSecretZombie: 'String',
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
      mobile: 'Boolean',
      client: 'Boolean',
    },
    notificationSettings: {
      vibrate: 'Boolean',
      sound: 'Boolean',
    },
    active: 'Boolean',
    gotEquipment: 'Boolean',
    notes: 'String',
  };
  serverMethods.set('createPlayer', {
      required:
          Utils.merge(
              {playerId: '!PlayerId', userId: 'UserId', gameId: 'GameId'},
              PLAYER_PROPERTIES)
  });
  serverMethods.set('updatePlayer', {
    required: {playerId: 'PlayerId'},
    optional: PLAYER_PROPERTIES
  });


  // Missions
  const MISSION_PROPERTIES = {
    begin: 'TimestampMs',
    end: 'TimestampMs',
    name: 'String',
    detailsHtml: 'String',
    groupId: 'GroupId',
  };
  serverMethods.set('addMission', {
    required:
        Utils.merge(
            {missionId: '!MissionId', groupId: 'GroupId', gameId: 'GameId'},
            MISSION_PROPERTIES)
  });
  serverMethods.set('updateMission', {
    required: {missionId: 'MissionId'},
    optional: MISSION_PROPERTIES
  });

  serverMethods.set('selfInfect', {required: {playerId: 'PlayerId'}});

  const GROUP_PROPERTIES = {
    name: 'String',
    allegianceFilter: 'String',
    ownerPlayerId: '?PlayerId',
    autoAdd: 'Boolean',
    autoRemove: 'Boolean',
    membersCanAdd: 'Boolean',
    membersCanRemove: 'Boolean',
  };
  serverMethods.set('createGroup', {
    required:
        Utils.merge({groupId: '!GroupId', gameId: 'GameId'}, GROUP_PROPERTIES)
  });
  serverMethods.set('updateGroup', {
    required: {groupId: 'GroupId'},
    optional: GROUP_PROPERTIES,
  });

  const REWARD_CATEGORY_PROPERTIES = {
    name: 'String',
    points: 'Number',
    seed: 'String',
    limitPerPlayer: 'Number',
  };
  serverMethods.set('addRewardCategory', {
    required:
        Utils.merge(
            {rewardCategoryId: '!RewardCategoryId', gameId: 'GameId'},
            REWARD_CATEGORY_PROPERTIES),
  });
  serverMethods.set('updateRewardCategory', {
    required: {rewardCategoryId: 'RewardCategoryId'},
    optional: REWARD_CATEGORY_PROPERTIES,
  });

  serverMethods.set('addReward', {
    required: {
      gameId: 'GameId',
      rewardId: '!RewardId',
      rewardCategoryId: 'RewardCategoryId',
    },
  });

  serverMethods.set('addRewards', {
    required: {
      // gameId: 'GameId',
      rewardCategoryId: 'RewardCategoryId',
      count: 'Number',
    },
  });

  serverMethods.set('claimReward', {
    required: {
      gameId: 'GameId',
      playerId: 'PlayerId',
      rewardId: 'RewardId',
    },
  });


  const CHAT_ROOM_PROPERTIES = {
    name: 'String',
    withAdmins: 'Boolean',
  };
  serverMethods.set('createChatRoom', {
    required:
        Utils.merge(
            {chatRoomId: '!ChatRoomId', groupId: 'GroupId'},
            CHAT_ROOM_PROPERTIES)
  });
  serverMethods.set('updateChatRoom', {
    required: {chatRoomId: 'ChatRoomId'},
    optional: CHAT_ROOM_PROPERTIES,
  });
  serverMethods.set('setLastSeenChatTime', {
    required: {
      chatRoomId: 'ChatRoomId',
      playerId: 'PlayerId',
      timestamp: 'TimestampMs',
    },
  });

  const MAP_PROPERTIES = {
    name: 'String',
  };
  serverMethods.set('createMap', {
    required:
        Utils.merge(
            {mapId: '!MapId', groupId: 'GroupId'},
            MAP_PROPERTIES)
  });
  serverMethods.set('updateMap', {
    required: {mapId: 'MapId'},
    optional: MAP_PROPERTIES,
  });

  const POINT_PROPERTIES = {
    name: 'String',
    playerId: '?PlayerId',
    color: 'String',
    latitude: 'Number',
    longitude: 'Number',
  };
  serverMethods.set('addPoint', {
    required:
        Utils.merge(
            {pointId: '!PointId', mapId: 'MapId'},
            POINT_PROPERTIES)
  });

  serverMethods.set('addPlayerToGroup', {
    required: {
      groupId: 'GroupId',
      otherPlayerId: 'PlayerId',
      playerId: '?PlayerId',
    },
  });

  serverMethods.set('removePlayerFromGroup', {
    required: {
      groupId: 'GroupId',
      otherPlayerId: 'PlayerId',
      playerId: '?PlayerId',
    },
  });

  serverMethods.set('addAdmin', {
    required: {gameId: 'GameId', userId: 'UserId'}
  });

  serverMethods.set('joinHorde', {required: {playerId: 'PlayerId'}});
  serverMethods.set('joinResistance', {required: {playerId: 'PlayerId'}});

  serverMethods.set('sendChatMessage', {
    required: {
      messageId: '!MessageId',
      chatRoomId: 'ChatRoomId',
      playerId: 'PlayerId',
      message: 'String',
    },
  });

  serverMethods.set('addRequestCategory', {
    required: {
      requestCategoryId: '!RequestCategoryId',
      chatRoomId: 'ChatRoomId',
      playerId: 'PlayerId',
      text: 'String',
      type: 'String',
    },
  });

  serverMethods.set('addRequest', {
    required: {
      requestCategoryId: 'RequestCategoryId',
      requestId: '!RequestId',
      playerId: 'PlayerId',
    },
  });

  serverMethods.set('respondToRequest', {
    required: {
      requestId: 'RequestId',
      text: '?String',
    },
  });

  serverMethods.set('addLife', {
    required: {
      playerId: 'PlayerId',
      lifeId: '!LifeId',
    }
  });

  serverMethods.set('infect', {
    required: {
      infectionId: '!InfectionId',
      playerId: '?PlayerId',
      infecteeLifeCode: '?String',
      infecteePlayerId: '?PlayerId',
    },
  });

  const NOTIFICATION_CATEGORY_PROPERTIES = {
    name: 'String',
    message: 'String',
    previewMessage: 'String',
    sound: 'Boolean',
    vibrate: 'Boolean',
    groupId: '?GroupId',
    playerId: '?PlayerId',
    // email: 'Boolean',
    app: 'Boolean',
    destination: '?String',
    sendTime: 'TimestampMs',
    // allegianceFilter: 'String',
    icon: '?String',
  };
  serverMethods.set('sendNotification', {
    required:
        Utils.merge(
            {
              notificationId: '!NotificationCategoryId',
              // gameId: 'GameId'
            },
            NOTIFICATION_CATEGORY_PROPERTIES),
  });
  serverMethods.set('updateNotification', {
    required: {notificationId: 'NotificationCategoryId'},
    optional: NOTIFICATION_CATEGORY_PROPERTIES,
  });


  const NOTIFICATION_PROPERTIES = {
    message: '?String',
    previewMessage: '?String',
    sound: '?Boolean',
    vibrate: '?Boolean',
    email: '?Boolean',
    app: '?Boolean',
    destination: '?String',
    icon: '?String',
  };
  serverMethods.set('addNotification', {
    required:
        Utils.merge(
            {
              notificationId: '!NotificationId',
              notificationCategoryId: 'NotificationCategoryId',
              gameId: 'GameId',
              playerId: 'PlayerId',
            },
            NOTIFICATION_PROPERTIES),
  });


  const QUIZ_QUESTION_PROPERTIES = {
    text: 'String',
    type: 'String',
  };
  serverMethods.set('addQuizQuestion', {
    required:
        Utils.merge(
            {quizQuestionId: '!QuizQuestionId', gameId: 'GameId'},
            QUIZ_QUESTION_PROPERTIES)
  });
  serverMethods.set('updateQuizQuestion', {
    required: {quizQuestionId: 'QuizQuestionId'},
    optional: QUIZ_QUESTION_PROPERTIES,
  });


  const QUIZ_ANSWER_PROPERTEIS = {
    text: 'String',
    order: 'Number',
    isCorrect: 'Boolean',
  };
  serverMethods.set('addQuizAnswer', {
    required:
        Utils.merge(
            {quizAnswerId: '!QuizAnswerId', quizQuestionId: 'QuizQuestionId'},
            QUIZ_ANSWER_PROPERTEIS)
  });
  serverMethods.set('updateQuizAnswer', {
    required: {quizAnswerId: 'QuizAnswerId'},
    optional: QUIZ_ANSWER_PROPERTEIS,
  });

  serverMethods.set('markNotificationSeen', {
    required: {playerId: 'PlayerId', notificationId: 'NotificationCategoryId',}
  });

  
  Bridge.SERVER_METHODS_MAP = serverMethods;
  Bridge.SERVER_METHODS = Array.from(serverMethods.keys());

  let bridgeMethods = new Map(serverMethods);

  bridgeMethods.set('attemptAutoSignIn', {});
  bridgeMethods.set('listenToDatabase', {});
  bridgeMethods.set('listenToGameAsAdmin', {});
  bridgeMethods.set('listenToGameAsNonAdmin', {});

  Bridge.METHODS_MAP = bridgeMethods;
  Bridge.METHODS = Array.from(bridgeMethods.keys());
})();