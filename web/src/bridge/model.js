'use strict';

var models = {
  gun: {
    link: ['guns', 'gunId'], // How to find this object
    path: ['guns'], // To whom this object belongs
    gameId: '', // Properties of this object (and potential parent linkages)
    playerId: '',
    label: '',
    a: []
  },
  chatRoom: {
    link: ['chatRooms', 'chatRoomId'],
    path: ['chatRooms'],
    accessGroupId: '',
    gameId: '',
    messages: [],
    name: '',
    withAdmins: false,
    requestCategories: []
  },
  game: {
    link: ['games', 'gameId'],
    path: ['games'],
    adminUsers: [],
    chatRooms: [],
    declareHordeEndTime: 0,
    declareResistanceEndTime: 0,
    endTime: 0,
    faqHtml: '',
    groups: [],
    guns: [],
    isActive: false,
    maps: [],
    missions: [],
    name: '',
    players: [],
    quizQuestions: [],
    registrationEndTime: 0,
    rewardCategories: [],
    rulesHtml: '',
    startTime: 0,
    stunTimer: 0,
    adminContactPlayerId: '',

    // for fake server
    loaded: false,
    defaultProfileImages: [],
    queuedNotifications: []
  },
  group: {
    link: ['groups', 'groupId'],
    path: ['groups'],
    allegianceFilter: '',
    autoAdd: false,
    autoRemove: false,
    canAddOthers: false,
    canAddSelf: false,
    canRemoveOthers: false,
    canRemoveSelf: false,
    gameId: '',
    name: '',
    ownerPlayerId: '',
    players: [],
    memberships: [] //?
  },
  map: {
    link: ['maps', 'mapId'],
    path: ['maps'],
    accessGroupId: '',
    gameId: '',
    markers: [],
    name: '',
  },
  mission: {
    link: ['missions', 'missionId'],
    path: ['missions'],
    accessGroupId: '',
    beginTime: 0,
    detailsHtml: '',
    endTime: 0,
    gameId: '',
    name: '',
    rsvpersGroupId: ''
  },
  playerPrivate: {
    link: ['playersPrivate', 'playerId'],
    path: ['players'],
    associatedMaps: [],
    beInPhotos: false,
    canInfect: false,
    gameId: '',
    gotEquipment: false,
    needGun: false,
    notes: '',
    notificationSettings: [],
    notifications: [],
    userId: '',
    volunteer: [],
    wantToBeSecretZombie: false
  },
  playerPublic: {
    link: ['playersPublic', 'playerId'],
    path: ['players'],
    active: false,
    allegiance: '',
    claims: [],
    name: '',
    number: 0,
    points: 0,
    profileImageUrl: '',
    userId: ''
  },
  marker: {
    link: ['markers', 'markerId'],
    path: ['maps', 'mapId', 'markers'],
    color: '',
    latitude: 0,
    longitude: 0,
    name: '',
    playerId: '',
    mapId: ''
  },
  message: {
    link: ['chatRooms', 'chatRoomId', 'messages', 'messageId'],
    path: ['chatRooms', 'chatRoomId', 'messages'],
    message: '',
    image: '',
    index: '',
    location: '',
    playerId: '',
    time: 0,
    chatRoomId: '',
    gameId: ''
  },
  queuedNotification: {
    link: ['queuedNotifications', 'queuedNotificationId'],
    path: ['playersPrivate', 'playerId', 'notifications'],
    destination: '',
    email: false,
    gameId: '',
    groupId: '',
    icon: '',
    message: '',
    mobile: false,
    previewMessage: '',
    sent: false,
    site: false,
    sound: false,
    vibrate: false

  },
  quizQuestion: {
    link: ['games', 'gameId', 'quizQuestions', 'quizQuestionId'],
    path: ['quizQuestions'],
    answers: [],
    text: '',
    type: '',
    number: 0,
    gameId: ''
  },
  quizAnswer: {
    link: ['games', 'gameId', 'quizQuestions', 'quizQuestionId', 'answers', 'quizAnswerId'],
    path: ['quizQuestions', 'quizQuestionId', 'answers'],
    isCorrect: false,
    order: 0,
    text: '',
    number: 0
  },
  rewardCategory: {
    link: ['rewardCategories', 'rewardCategoryId'],
    path: ['rewardCategories'],
    badgeImageUrl: '',
    claimed: 0,
    description: '',
    gameId: '',
    limitPerPlayer: 0,
    name: '',
    points: 0,
    rewards: [],
    shortName: ''

  },
  reward: {
    link: ['rewards', 'rewardId'],
    path: ['rewardCategories', 'rewardCategoryId', 'rewards'],
    code: '',
    playerId: '',
    rewardCategoryId: '',
    gameId: ''
  },
  user: {
    link: ['users', 'userId'],
    path: ['users'],
    a: true,
    games: [],
    publicPlayers: []
  },
  admin: {
    link: ['games', 'gameId', 'adminUsers', 'userId'],
    path: ['adminUsers'],
    userId: '',
    gameId: '',
  },
  claim: {
    link: ['publicPlayers', 'playerId', 'claims', 'rewardId'],
    path: ['players', 'playerId', 'claims'],
    rewardCategoryId: '',
    rewardId: '',
    time: 0,
    gameId: '',
    playerId: ''
  },
  userPlayer: {
    link: ['users', 'userId', 'publicPlayers', 'playerId'],
    path: ['users', 'userId', 'publicPlayers'],
    gameId: '',
    userId: ''
  },
  playerChatRoomMembership: {
    link: ['privatePlayers', 'privatePlayerId', 'chatRoomMemberships', 'chatRoomId'],
    path: ['players', 'publicPlayerId', 'private', 'chatRoomMemberships'],
    chatRoomId: '',
    publicPlayerId: '',
    privatePlayerId: '',
    gameId: '',
    isVisible: false
  },
  playerMissionMembership: {
    link: ['privatePlayers', 'playerId', 'missionMemberships', 'missionId'],
    path: ['players', 'playerId', 'private', 'missionMemberships'],
    missionId: '',
    playerId: '',
    gameId: '',
  },
  infection: {
    link: ['publicPlayers', 'playerId', 'infections', 'infectionId'],
    path: ['players', 'playerId', 'infections'],
    time: 0,
    infectorId: 0,
    infectionId: '',
    gameId: '',
    playerId: ''
  },
  publicLife: {
    link: ['publicLives', 'publicLifeId'],
    path: ['players', 'playerId', 'lives'],
    time: 0,
    private: '',
    privateLifeId: '',
    gameId: ''
  },
  privateLife: {
    link: ['privateLives', 'privateLifeId'],
    path: ['players', 'playerId', 'lives', 'lifeId', 'private'],
    code: '',
    gameId: '',
  },
  publicPlayer: {
    link: ['publicPlayers', 'publicPlayerId'],
    path: ['players'],
    isActive: false,
    userId: '',
    number: 0,
    allegiance: '',
    name: '',
    points: '',
    profileImageUrl: '',
    gameId: '',
    privatePlayerId: '',
    lives: [],
    claims: [],
    infections: []
  },
  privatePlayer: {
    link: ['privatePlayers', 'privatePlayerId'],
    path: ['players', 'playerId', 'private'],
    isActive: false,
    beInPhotos: false,
    userId: '',
    gameId: '',
    canInfect: false,
    needGun: false,
    startAsZombie: false,
    wantToBeSecretZombie: false,
    gotEquipment: '',
    notes: '',
    notifications: [],
    chatRoomMemberships: [],
    missionMemberships: [],
    mapMemberships: [],
    playerId: '',
    volunteer: [], // special,
    notificationSettings: [], // special
  },
  volunteer: { // special
    advertising: false,
    logistics: false,
    communications: false,
    moderator: false,
    cleric: false,
    sorcerer: false,
    admin: false,
    photographer: false,
    chronicler: false,
    android: false,
    ios: false,
    server: false,
    client: false
  },
  notificationSettings: { // special
    sound: false,
    vibrate: false
  },
  notification: {
    link: ['privatePlayers', 'privatePlayerId', 'notifications', 'notificationId'],
    path: ['players', 'playerId', 'private'],
    message: '',
    previewMessage: '',
    queuedNotificationId: '',
    seenTime: 0,
    sound: false,
    vibrate: false,
    site: '',
    mobile: false,
    time: 0,
    email: '',
    destination: ''
  }
};

class Model {
  constructor(args, model, sortOn) {
    assert(args.id !== undefined);
    model.id = args.id;
    var newLink = [];
    model.link.forEach(function (item) {
      if (args.hasOwnProperty(item))
        newLink.push(args[item]);
      else
        newLink.push(item);
    });
    this.link = newLink.join('/');
    this.sortOn = sortOn || '';
    this.path = model.path;
    this._properties = [];
    this._collections = [];
    for (var key in model) {
      if (key === 'link' || key === 'path') continue;
      if (model.hasOwnProperty(key)) {
        if (typeof model[key] === 'object') this._collections.push(key);
        else this._properties.push(key);
      }
    }
    Utils.copyProperties(this, args, this._properties);
    Utils.addEmptyLists(this, this._collections);
  }
  initialize(args, source, writer, privatePlayerExclusion = false) {
    // Non destructive copyProperties since we have default
    // values in the model already and they were created in
    // the constructor
    if (args !== null) {
      for (let propertyName of this._properties) {
        let val = args[propertyName];
        if (val !== undefined)
          this[propertyName] = val;
      }
    }
    var pathFilled = [];
    this.path.forEach((item) => {
      if (this.hasOwnProperty(item)) {
        pathFilled.push(Utils.findIndexById(Utils.get(source, pathFilled), this[item]));
      } else {
        pathFilled.push(item);
      }
    });
    if (writer !== null) {
      let insertIndex = null;
      if (this.sortOn) {
        let existing = Utils.get(source, pathFilled);
        insertIndex = existing.findIndex((existing) => existing[this.sortOn] > this[this.sortOn]);
        if (insertIndex < 0)
          insertIndex = existing.length;
      }
      writer.insert(pathFilled, insertIndex, this);
    }

    if (!privatePlayerExclusion)
      this.path = pathFilled.concat([Utils.findIndexById(Utils.get(source, pathFilled), this.id)]);
    else
      this.path = pathFilled;
  }
}
Model.Gun = class extends Model {
  constructor(args) {
    super(args, models.gun);
  }
};
Model.User = class extends Model {
  constructor(args) {
    super(args, models.user);
  }
};
Model.UserPlayer = class extends Model {
  constructor(args) {
    super(args, models.userPlayer);
  }
};
Model.Game = class extends Model {
  constructor(args) {
    super(args, models.game);
  }
};
Model.QuizQuestion = class extends Model {
  constructor(args) {
    super(args, models.quizQuestion, 'number');
  }
};
Model.QuizAnswer = class extends Model {
  constructor(args) {
    super(args, models.quizAnswer, 'number');
  }
};
Model.Group = class extends Model {
  constructor(args) {
    super(args, models.group);
  }
};
Model.ChatRoom = class extends Model {
  constructor(args) {
    super(args, models.chatRoom);
  }
};
Model.Map = class extends Model {
  constructor(args) {
    super(args, models.map);
  }
};
Model.Marker = class extends Model {
  constructor(args) {
    super(args, models.marker);
  }
};
Model.Message = class extends Model {
  constructor(args) {
    super(args, models.message, 'time');
  }
};
Model.RewardCategory = class extends Model {
  constructor(args) {
    super(args, models.rewardCategory);
  }
};
Model.Reward = class extends Model {
  constructor(args) {
    super(args, models.reward);
  }
};
Model.Mission = class extends Model {
  constructor(args) {
    super(args, models.mission);
  }
};
Model.QueuedNotification = class extends Model {
  constructor(args) {
    super(args, models.queuedNotification);
  }
};
Model.Admin = class extends Model {
  constructor(args) {
    super(args, models.admin);
  }
};
Model.Claim = class extends Model {
  constructor(args) {
    super(args, models.claim);
  }
};
Model.PlayerChatRoomMembership = class extends Model {
  constructor(args) {
    super(args, models.playerChatRoomMembership);
  }
};
Model.PlayerMissionMembership = class extends Model {
  constructor(args) {
    super(args, models.playerMissionMembership);
  }
};
Model.PlayerGroupMembership = class extends Model {
  constructor(args) {
    super(args, models.playerGroupMembership);
  }
};
Model.Infection = class extends Model {
  constructor(args) {
    super(args, models.infection);
  }
};
Model.PublicLife = class extends Model {
  constructor(args) {
    super(args, models.publicLife);
  }
};
Model.PrivateLife = class extends Model {
  constructor(args) {
    super(args, models.privateLife);
  }
};
Model.PublicPlayer = class extends Model {
  constructor(args) {
    super(args, models.publicPlayer);
  }
};
Model.PrivatePlayer = class extends Model {
  constructor(args) {
    super(args, models.privatePlayer);
  }
};
Model.Notification = class extends Model {
  constructor(args) {
    super(args, models.notification);
  }
};


/*********************************************
 * For the Fake Server
 */

const DEFAULT_PROFILE_IMAGE_PROPERTIES = ['gameId', 'defaultProfileImageId', 'allegianceFilter', 'profileImageUrl'];
const DEFAULT_PROFILE_IMAGE_COLLECTIONS = [];
Model.DefaultProfileImage = class {
  constructor(id, args) {
    this.id = id;
    Utils.copyProperties(this, args, DEFAULT_PROFILE_IMAGE_PROPERTIES);
    Utils.addEmptyLists(this, DEFAULT_PROFILE_IMAGE_COLLECTIONS);
  }
};

const GROUP_MEMBERSHIP_PROPERTIES = ["playerId"];
const GROUP_MEMBERSHIP_COLLECTIONS = [];
Model.GroupMembership = class {
  constructor(id, args) {
    this.id = id;
    Utils.copyProperties(this, args, GROUP_MEMBERSHIP_PROPERTIES);
    Utils.addEmptyLists(this, GROUP_MEMBERSHIP_COLLECTIONS);
  }
};

const REQUEST_CATEGORY_PROPERTIES = ["playerId", "time", "text", "type", "dismissed"];
const REQUEST_CATEGORY_COLLECTIONS = ["requests"];
Model.RequestCategory = class {
  constructor(id, args) {
    this.id = id;
    Utils.copyProperties(this, args, REQUEST_CATEGORY_PROPERTIES);
    Utils.addEmptyLists(this, REQUEST_CATEGORY_COLLECTIONS);
  }
};


const REQUEST_PROPERTIES = ["playerId", "response"];
const REQUEST_COLLECTIONS = [];
Model.Request = function (id, args) {
  this.id = id;
  Utils.copyProperties(this, args, REQUEST_PROPERTIES);
  Utils.addEmptyLists(this, REQUEST_COLLECTIONS);
};