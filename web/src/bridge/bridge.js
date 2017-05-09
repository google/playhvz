'use strict';

class Bridge {
  constructor(env, appWriter) {
    this.inner = Bridge.makeInnerBridge_(env, appWriter);

    for (let [method, expectations] of Bridge.METHODS_MAP) {
      this[method] =
          (...args) => {
            Utils.checkObject(
                ...args,
                expectations.required,
                expectations.optional,
                this.check_.bind(this));
            assert(this.inner[method]);
            return this.inner[method](...args);
          };
    }
  }

  attemptAutoSignIn() {
    return this.inner.attemptAutoSignIn();
  }

  listenToGame(gameId) {
    return this.inner.listenToGame(gameId);
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
    assert(typeName in Bridge);
    Bridge[typeName].verify(value);
    // todo, put existence checks here
  }

  static makeInnerBridge_(env, appWriter) {
    if (env == 'fake') {
      return new FakeBridge(appWriter);
    } else {
      let config;
      let serverUrl;
      if (env == 'prod') {
        serverUrl = "https://humansvszombies-24348.appspot.com/";
        config = {
          apiKey: "AIzaSyCyNJ8cgkeiWNOO9axMDx1BLXSgf69I2RM",
          authDomain: "trogdors-29fa4.firebaseapp.com",
          databaseURL: "https://trogdors-29fa4.firebaseio.com",
          projectId: "trogdors-29fa4",
          storageBucket: "trogdors-29fa4.appspot.com",
          messagingSenderId: "625580091272"
        };
      } else if (env == 'dev') {
        serverUrl = "trololol"; // we dont have a dev frontend
        config = {
          apiKey: "AIzaSyCH6Z73pymnu8lzn8b5-O8yuf2FrOt8GOs",
          authDomain: "zeds-dbe0f.firebaseapp.com",
          databaseURL: "https://zeds-dbe0f.firebaseio.com",
          storageBucket: "zeds-dbe0f.appspot.com",
          messagingSenderId: "721599614458",
        };
      } else {
        throwError("Bad env:", env);
      }
      return new RemoteBridge(serverUrl, config, appWriter);
    }
  }
}

Bridge.UserId = {
  generate: (note) => Utils.generateId('user', note),
  verify: (id) => id.startsWith('user-'),
};
Bridge.GameId = {
  generate: (note) => Utils.generateId('game', note),
  verify: (id) => id.startsWith('game-'),
};
Bridge.PlayerId = {
  generate: (note) => Utils.generateId('player', note),
  verify: (id) => id.startsWith('player-'),
};
Bridge.LifeId = {
  generate: (note) => Utils.generateId('life', note),
  verify: (id) => id.startsWith('life-'),
};
Bridge.InfectionId = {
  generate: (note) => Utils.generateId('infection', note),
  verify: (id) => id.startsWith('infection-'),
};
Bridge.MissionId = {
  generate: (note) => Utils.generateId('mission', note),
  verify: (id) => id.startsWith('mission-'),
};
Bridge.GunId = {
  generate: (note) => Utils.generateId('gun', note),
  verify: (id) => id.startsWith('gun-'),
};
Bridge.GroupId = {
  generate: (note) => Utils.generateId('group', note),
  verify: (id) => id.startsWith('group-'),
};
Bridge.ChatRoomId = {
  generate: (note) => Utils.generateId('chatRoom', note),
  verify: (id) => id.startsWith('chatRoom-'),
};
Bridge.MessageId = {
  generate: (note) => Utils.generateId('message', note),
  verify: (id) => id.startsWith('message-'),
};
Bridge.NotificationCategoryId = {
  generate: (note) => Utils.generateId('notificationCategory', note),
  verify: (id) => id.startsWith('notificationCategory-'),
};
Bridge.NotificationId = {
  generate: (note) => Utils.generateId('notification', note),
  verify: (id) => id.startsWith('notification-'),
};
Bridge.RewardCategoryId = {
  generate: (note) => Utils.generateId('rewardCategory', note),
  verify: (id) => id.startsWith('rewardCategory-'),
};
Bridge.RewardId = {
  generate: (note) => Utils.generateId('reward', note),
  verify: (id) => id.startsWith('reward-'),
};
Bridge.MembershipId = {
  generate: (note) => Utils.generateId('membership', note),
  verify: (id) => id.startsWith('membership-'),
};
Bridge.ClaimId = {
  generate: (note) => Utils.generateId('claim', note),
  verify: (id) => id.startsWith('claim-'),
};
Bridge.QuizQuestionId = {
  generate: (note) => Utils.generateId('quizQuestion', note),
  verify: (id) => id.startsWith('quizQuestion-'),
};
Bridge.QuizAnswerId = {
  generate: (note) => Utils.generateId('quizAnswer', note),
  verify: (id) => id.startsWith('quizAnswer-'),
};

// Sets Bridge.METHODS_MAP and Bridge.serverMethods
(function() {
  let serverMethods = new Map();

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
    required: Utils.merge({gameId: '!GameId', firstAdminUserId: 'UserId'}, GAME_PROPERTIES),
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
    beginTime: 'TimestampMs',
    endTime: 'TimestampMs',
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
      gameId: 'GameId',
      numNewRewards: 'Number',
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
    withAdmin: 'Boolean',
  };
  serverMethods.set('createChatRoom', {
    required:
        Utils.merge(
            {chatRoomId: '!ChatRoomId', gameId: 'GameId', groupId: 'GroupId'},
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

  serverMethods.set('addPlayerToGroup', {
    required: {
      groupId: 'GroupId',
      playerToAddId: 'PlayerId',
      playerId: '?PlayerId',
    },
  });

  serverMethods.set('removePlayerFromGroup', {
    required: {
      groupId: 'GroupId',
      playerToRemoveId: 'PlayerId',
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
    email: 'Boolean',
    app: 'Boolean',
    destination: '?String',
    sendTime: 'TimestampMs',
    allegianceFilter: 'String',
    icon: '?String',
  };
  serverMethods.set('addNotificationCategory', {
    required:
        Utils.merge(
            {
              notificationCategoryId: '!NotificationCategoryId',
              gameId: 'GameId'
            },
            NOTIFICATION_CATEGORY_PROPERTIES),
  });
  serverMethods.set('updateNotificationCategory', {
    required: {notificationCategoryId: 'NotificationCategoryId'},
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
  bridgeMethods.set('listenToGame', {
    required: 'GameId',
  });

  Bridge.METHODS_MAP = bridgeMethods;
  Bridge.METHODS = Array.from(bridgeMethods.keys());
})();