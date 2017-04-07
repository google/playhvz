'use strict';

const USER_PROPERTIES = [];
const USER_COLLECTIONS = [
  {arrayName:"players"}
];
const USER_PLAYER_PROPERTIES = ["gameId", "playerId"];
const USER_PLAYER_COLLECTIONS = [];
const GUN_PROPERTIES = ["number", "playerId"];
const GUN_COLLECTIONS = [];
const GAME_PROPERTIES = ["name", "rulesUrl", "stunTimer"];
const GAME_COLLECTIONS = [
  {arrayName: "missions", mapName: "missionsById"},
  {arrayName: "rewardCategories", mapName: "rewardCategoriesById"},
  {arrayName: "chatRooms", mapName: "chatRoomsById"},
  {arrayName: "players", mapName: "playersById"},
  {arrayName: "adminUserIds"},
  {arrayName: "notificationCategories", mapName: "notificationCategoriesById"}
];
const CHAT_ROOM_PROPERTIES = ["allegianceFilter", "name"];
const CHAT_ROOM_COLLECTIONS = [
  {arrayName: "messages", mapName: "messagesById"},
  {arrayName: "memberships", mapName: "membershipsById"},
];
const CHAT_ROOM_MEMBERSHIP_PROPERTIES = ["playerId"];
const CHAT_ROOM_MEMBERSHIP_COLLECTIONS = [];
const CHAT_ROOM_MESSAGE_PROPERTIES = ["index", "message", "playerId", "time"];
const CHAT_ROOM_MESSAGE_COLLECTIONS = [];
const MISSION_PROPERTIES = ["name", "beginTime", "endTime", "url", "allegianceFilter"];
const MISSION_COLLECTIONS = [];
const NOTIFICATION_CATEGORY_PROPERTIES = ["name"];
const NOTIFICATION_CATEGORY_COLLECTIONS = [];
const PLAYER_PROPERTIES = ["userId", "number", "allegiance", "infectable", "name", "needGun", "points", "profileImageUrl", "startAsZombie", "volunteer"];
const PLAYER_COLLECTIONS = [
  {arrayName: "infections"},
  {arrayName: "lives"},
  {arrayName: "rewards"},
  {arrayName: "notifications"},
];
const PLAYER_REWARD_PROPERTIES = ["time", "rewardId", "rewardCategoryId"];
const PLAYER_REWARD_COLLECTIONS = [];
const PLAYER_LIFE_PROPERTIES = ["time", "code"];
const PLAYER_LIFE_COLLECTIONS = [];
const PLAYER_INFECTION_PROPERTIES = ["time", "infectorId"];
const PLAYER_INFECTION_COLLECTIONS = [];
const PLAYER_NOTIFICATION_PROPERTIES = ["message", "previewMessage", "notificationCategoryId", "seenTime", "sendTime", "sound", "vibrate"];
const PLAYER_NOTIFICATION_COLLECTIONS = [];
const REWARD_CATEGORY_PROPERTIES = ["name", "points", "seed", "claimed"];
const REWARD_CATEGORY_COLLECTIONS = [
  {arrayName: "rewards", mapName: "rewardsById"}
];
const REWARD_CATEGORY_REWARD_PROPERTIES = ["playerId", "code"];
const REWARD_CATEGORY_REWARD_COLLECTIONS = [];

// Not sure why this HTMLImports.whenReady is really needed.
// Something about polymer initialization order.
// I think we"re not supposed to need this.
class FirebaseDatabase {
  constructor(delegate) {
    this.firebaseUser = null;
    this.delegate = delegate;
    this.firebaseRoot = null;
    this.userId = null;
    this.gameId = null;

    // Initialize Firebase
    var config = {
      apiKey: "AIzaSyCH6Z73pymnu8lzn8b5-O8yuf2FrOt8GOs",
      authDomain: "zeds-dbe0f.firebaseapp.com",
      databaseURL: "https://zeds-dbe0f.firebaseio.com",
      storageBucket: "zeds-dbe0f.appspot.com",
      messagingSenderId: "721599614458",
    };
    firebase.initializeApp(config);

    this.firebaseRoot = firebase.app().database().ref();

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // User is signed in.
        this.setUser_(user);
      } else {
        // No user is signed in
        this.delegate.onAutoSignInFailed();
      }
    });
  }

  signIn() {
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
          // This gives you a Google Access Token. You can use it to access the Google API.
          var token = result.credential.accessToken;
          // The signed-in user info.
          this.setUser_(result.user);
          // ...
        }).catch((error) => {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;
          // ...
        });
  }

  setUser_(user) {
    this.firebaseUser = user;
    this.userId = user.uid;
    this.delegate.onUserSignedIn(this.userId);
    this.listenToSpecificUser(this.userId);
    this.shallowListenToGames();
    this.listenToGuns();
  }

  setGameId(gameId) {
    if (gameId && this.gameId) {
      throw "Cannot change game once selected, must refresh!";
    }
    if (gameId) {
      this.listenToSpecificGame(gameId);
    }
  }

  getGunIndex_(id) { return Utils.findIndexById(this.delegate.get("database.guns"), id); }
  getGameIndex_(id) { return Utils.findIndexById(this.delegate.get("database.games"), id); }
  getNotificationCategoryIndex_(id) { return Utils.findIndexById(this.delegate.get("database.game.notificationCategories"), id); }
  getRewardCategoryIndex_(id) { return Utils.findIndexById(this.delegate.get("database.game.rewardCategories"), id); }
  getRewardCategoryRewardIndex_(rewardCategoryId, rewardCategoryRewardId) { return Utils.findIndexById(this.delegate.get("database.game.rewardCategoriesById." + rewardCategoryId).rewards, rewardCategoryRewardId); }
  getMissionIndex_(id) { return Utils.findIndexById(this.delegate.get("database.game.missions"), id); }
  getUserPlayerIndex_(id) { return Utils.findIndexById(this.delegate.get("database.user.players"), id); }
  getChatRoomIndex_(id) { return Utils.findIndexById(this.delegate.get("database.game.chatRooms"), id); }
  getPlayerIndex_(id) {
    if (!this.delegate.get("database.game") || !this.delegate.get("database.game.players")) {
      debugger;
    }
    return Utils.findIndexById(this.delegate.get("database.game.players"), id);
  }
  getPlayerRewardIndex_(playerId, playerRewardId) { return Utils.findIndexById(this.delegate.get("database.game.playersById." + playerId).rewards, playerRewardId); }
  getPlayerLifeIndex_(playerId, playerLifeId) { return Utils.findIndexById(this.delegate.get("database.game.playersById." + playerId).lives, playerLifeId); }
  getPlayerInfectionIndex_(playerId, playerInfectionId) { return Utils.findIndexById(this.delegate.get("database.game.playersById." + playerId).infections, playerInfectionId); }
  getPlayerNotificationIndex_(playerId, playerNotificationId) {
    return Utils.findIndexById(this.delegate.get("database.game.playersById." + playerId).notifications, playerNotificationId);
  }
  getChatRoomMembershipIndex_(chatRoomId, chatRoomMembershipId) {
    return Utils.findIndexById(this.delegate.get("database.game.chatRoomsById." + chatRoomId).memberships, chatRoomMembershipId);
  }
  getChatRoomMessageIndex_(chatRoomId, chatRoomMessageId) {
    return Utils.findIndexById(this.delegate.get("database.game.chatRoomsById." + chatRoomId).messages, chatRoomMessageId);
  }

  // Figures out where we should insert an object in an array.
  // All objects must have "index" property to guide us.
  findInsertIndex(collection, newObjectIndex) {
    // For example if we want to insert an object like this:
    // {index: 5}
    // into an array that looks like this:
    // [{index: 0}, {index: 1}, {index: 4}, {index:6}]
    // then we'd want to insert it at index 3, so the resulting array would be:
    // [{index: 0}, {index: 1}, {index: 4}, {index: 5}, {index:6}]
    let insertIndex = collection.findIndex((existing) => existing.index > newObjectIndex);
    // If we couldnt find one greater than us, then we must be the greatest.
    // Insert us at the end.
    if (insertIndex < 0)
      insertIndex = collection.length;
    return insertIndex;
  }

  listenForPropertyChanges_(collectionRef, properties, collections, setCallback) {
    collectionRef.on("child_added", (change) => {
      if (properties.includes(change.getKey())) {
        setCallback(change.getKey(), change.val());
      } else if (collections.find((col) => col.arrayName == change.getKey())) {
        setCallback(change.getKey(), []);
      } else {
        throwError("Unexpected!", change.val(), change.getKey(), arguments);
      }
    });
    collectionRef.on("child_changed", (change) => {
      if (properties.includes(change.getKey())) {
        setCallback(change.getKey(), change.val());
      } else if (collections.find((col) => col.arrayName == change.getKey())) {
        // do nothing, covered elsewhere
      } else {
        throwError("Unexpected!", change.val(), change.getKey(), arguments);
      }
    });
    collectionRef.on("child_removed", (change) => {
      if (properties.includes(change.getKey())) {
        setCallback(change.getKey(), null);
      } else if (collections.find((col) => col.arrayName == change.getKey())) {
        setCallback(change.getKey(), []);
      } else {
        throwError("Unexpected!", change.val(), change.getKey(), arguments);
      }
    });
  }

  setupClientSideObject(id, snapshot, propertyNames, lists) {
    let obj = {id: id};
    let snapshotValue = snapshot.val();
    for (let propertyName of propertyNames) {
      let val = snapshotValue[propertyName];
      if (val === undefined)
        val = null;
      obj[propertyName] = val;
    }
    for (let {arrayName, mapName} of lists) {
      obj[arrayName] = [];
      if (mapName)
        obj[mapName] = {};
    }
    return obj;
  }

  shallowListenToGames() {
    this.firebaseRoot.child("games").on("child_added", (snap) => {
      let gameId = snap.getKey();
      let obj = this.setupClientSideObject(gameId, snap, GUN_PROPERTIES, GUN_COLLECTIONS);
      this.delegate.push("database.games", obj);
      this.delegate.set("database.gamesById. " + gameId, obj);
      this.listenForPropertyChanges_(
          snap.ref, GAME_PROPERTIES, GAME_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.games." + this.getGameIndex_(gameId) + "." + property, value);
          });
    });
    this.firebaseRoot.child("games").on("child_removed", (snap) => {
      this.splice("games", this.getGameIndex_(snap.getKey()), 1);
      delete this.delegate.get("database.gamesById")[snap.getKey()];
    });
  }

  listenToGuns() {
    this.firebaseRoot.child("guns").on("child_added", (snap) => {
      let gunId = snap.getKey();
      let obj = this.setupClientSideObject(gunId, snap, GUN_PROPERTIES, GUN_COLLECTIONS);
      this.delegate.push("database.guns", obj);
      this.delegate.set("database.gunsById." + gunId, obj);
      this.listenForPropertyChanges_(
          snap.ref, GUN_PROPERTIES, GUN_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.guns." + this.getGunIndex_(gunId) + "." + property, value);
          });
    });
  }

  listenToMissions_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/missions");
    ref.on("child_added", (snap) => {
      let missionId = snap.getKey();
      let obj = this.setupClientSideObject(missionId, snap, MISSION_PROPERTIES, MISSION_COLLECTIONS);
      this.delegate.push("database.game.missions", obj);
      this.delegate.set("database.game.missionsById." + missionId, obj);
      this.listenForPropertyChanges_(
          snap.ref, MISSION_PROPERTIES, MISSION_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.game.missions." + this.getMissionIndex_(missionId) + "." + property, value);
          });
    });
  }

  listenToChatRooms_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/chatRooms");
    ref.on("child_added", (snap) => {
      let chatRoomId = snap.getKey();
      let obj = this.setupClientSideObject(chatRoomId, snap, CHAT_ROOM_PROPERTIES, CHAT_ROOM_COLLECTIONS);
      this.delegate.push("database.game.chatRooms", obj);
      this.delegate.set("database.game.chatRoomsById." + chatRoomId, obj);
      this.listenForPropertyChanges_(
          snap.ref, CHAT_ROOM_PROPERTIES, CHAT_ROOM_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.game.chatRooms." + this.getChatRoomIndex_(chatRoomId) + "." + property, value);
          });
      this.listenToChatRoomMemberships_(gameId, chatRoomId);
      this.listenToChatRoomMessages_(gameId, chatRoomId);
    });
  }

  listenToChatRoomMemberships_(gameId, chatRoomId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/chatRooms/" + chatRoomId + "/memberships");
    ref.on("child_added", (snap) => {
      let chatRoomMembershipId = snap.getKey();
      let obj = this.setupClientSideObject(chatRoomMembershipId, snap, CHAT_ROOM_MEMBERSHIP_PROPERTIES, CHAT_ROOM_MEMBERSHIP_COLLECTIONS);
      this.delegate.push("database.game.chatRooms." + this.getChatRoomIndex_(chatRoomId) + ".memberships", obj);
      this.delegate.set("database.game.chatRooms." + this.getChatRoomIndex_(chatRoomId) + ".membershipsById." + chatRoomMembershipId, obj);
      this.listenForPropertyChanges_(
          snap.ref, CHAT_ROOM_MEMBERSHIP_PROPERTIES, CHAT_ROOM_MEMBERSHIP_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.game.chatRooms." + this.getChatRoomIndex_(chatRoomId) + ".memberships." + this.getChatRoomMembershipIndex_(chatRoomId, chatRoomMembershipId) + "." + property, value);
          });
    });
  }

  listenToChatRoomMessages_(gameId, chatRoomId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/chatRooms/" + chatRoomId + "/messages");
    ref.on("child_added", (snap) => {
      let chatRoomMessageId = snap.getKey();
      let obj = this.setupClientSideObject(chatRoomMessageId, snap, CHAT_ROOM_MESSAGE_PROPERTIES, CHAT_ROOM_MESSAGE_COLLECTIONS);
      let insertIndex =
          this.findInsertIndex(
              this.delegate.get("database.game.chatRooms." + this.getChatRoomIndex_(chatRoomId) + ".messages"),
              obj.index);
      this.delegate.splice(
          "database.game.chatRooms." + this.getChatRoomIndex_(chatRoomId) + ".messages",
          insertIndex, 0, obj);
      this.delegate.set("database.game.chatRooms." + this.getChatRoomIndex_(chatRoomId) + ".messagesById." + chatRoomMessageId, obj);
      this.listenForPropertyChanges_(
          snap.ref, CHAT_ROOM_MESSAGE_PROPERTIES, CHAT_ROOM_MESSAGE_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.game.chatRooms." + this.getChatRoomIndex_(chatRoomId) + ".messages." + this.getChatRoomMessageIndex_(chatRoomId, chatRoomMessageId) + "." + property, value);
          });
    });
  }

  listenToPlayers_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players");
    ref.on("child_added", (snap) => {
      let playerId = snap.getKey();
      let obj = this.setupClientSideObject(playerId, snap, PLAYER_PROPERTIES, PLAYER_COLLECTIONS);
      this.delegate.push("database.game.players", obj);
      this.delegate.set("database.game.playersById." + playerId, obj);
      this.listenForPropertyChanges_(
          snap.ref, PLAYER_PROPERTIES, PLAYER_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.game.players." + this.getPlayerIndex_(playerId) + "." + property, value);
          });
      this.listenToPlayerRewards_(gameId, playerId);
      this.listenToPlayerLives_(gameId, playerId);
      this.listenToPlayerInfections_(gameId, playerId);
      this.listenToPlayerNotifications_(gameId, playerId);
    });
  }

  listenToPlayerRewards_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/rewards");
    ref.on("child_added", (snap) => {
      let playerRewardId = snap.getKey();
      let obj = this.setupClientSideObject(playerRewardId, snap, PLAYER_REWARD_PROPERTIES, PLAYER_REWARD_COLLECTIONS);
      this.delegate.push("database.game.players." + this.getPlayerIndex_(playerId) + ".rewards", obj);
      this.listenForPropertyChanges_(
          snap.ref, PLAYER_REWARD_PROPERTIES, PLAYER_REWARD_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.game.players." + this.getPlayerIndex_(playerId) + ".rewards." + this.getPlayerRewardIndex_(playerId, playerRewardId) + "." + property, value);
          });
    });
  }

  listenToPlayerLives_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/lives");
    ref.on("child_added", (snap) => {
      let playerLifeId = snap.getKey();
      let obj = this.setupClientSideObject(playerLifeId, snap, PLAYER_LIFE_PROPERTIES, PLAYER_LIFE_COLLECTIONS);
      this.delegate.push("database.game.players." + this.getPlayerIndex_(playerId) + ".lives", obj);
      this.delegate.set("database.game.players." + this.getPlayerIndex_(playerId) + ".lives." + playerLifeId, obj);
      this.listenForPropertyChanges_(
          snap.ref, PLAYER_LIFE_PROPERTIES, PLAYER_LIFE_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.game.players." + this.getPlayerIndex_(playerId) + ".lives." + this.getPlayerLifeIndex_(playerId, playerLifeId) + "." + property, value);
          });
    });
  }

  listenToPlayerInfections_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/infections");
    ref.on("child_added", (snap) => {
      let playerInfectionId = snap.getKey();
      let obj = this.setupClientSideObject(playerInfectionId, snap, PLAYER_INFECTION_PROPERTIES, PLAYER_INFECTION_COLLECTIONS);
      this.delegate.push("database.game.players." + this.getPlayerIndex_(playerId) + ".infections", obj);
      this.delegate.set("database.game.players." + this.getPlayerIndex_(playerId) + ".infections." + playerInfectionId, obj);
      this.listenForPropertyChanges_(
          snap.ref, PLAYER_INFECTION_PROPERTIES, PLAYER_INFECTION_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.game.players." + this.getPlayerIndex_(playerId) + ".infections." + this.getPlayerInfectionIndex_(playerId, playerInfectionId) + "." + property, value);
          });
    });
  }

  listenToPlayerNotifications_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/notifications");
    ref.on("child_added", (snap) => {
      let playerNotificationId = snap.getKey();
      let obj = this.setupClientSideObject(playerNotificationId, snap, PLAYER_NOTIFICATION_PROPERTIES, PLAYER_NOTIFICATION_COLLECTIONS);
      this.delegate.push("database.game.players." + this.getPlayerIndex_(playerId) + ".notifications", obj);
      this.delegate.set("database.game.players." + this.getPlayerIndex_(playerId) + ".notifications." + playerNotificationId, obj);
      this.listenForPropertyChanges_(
          snap.ref, PLAYER_NOTIFICATION_PROPERTIES, PLAYER_NOTIFICATION_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.game.players." + this.getPlayerIndex_(playerId) + ".notifications." + this.getPlayerNotificationIndex_(playerId, playerNotificationId) + "." + property, value);
          });
    });
  }

  listenToNotificationCategories_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/notificationCategories");
    ref.on("child_added", (snap) => {
      let notificationCategoryId = snap.getKey();
      let obj = this.setupClientSideObject(notificationCategoryId, snap, NOTIFICATION_CATEGORY_PROPERTIES, NOTIFICATION_CATEGORY_COLLECTIONS);
      this.delegate.push("database.game.notificationCategories", obj);
      this.delegate.set("database.game.notificationCategoriesById." + notificationCategoryId, obj);
      this.listenForPropertyChanges_(
          snap.ref, NOTIFICATION_CATEGORY_PROPERTIES, NOTIFICATION_CATEGORY_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.game.notificationCategories." + this.getNotificationCategoryIndex_(notificationCategoryId) + "." + property, value);
          });
    });
  }

  listenToRewardCategories_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/rewardCategories");
    ref.on("child_added", (snap) => {
      let rewardCategoryId = snap.getKey();
      let obj = this.setupClientSideObject(rewardCategoryId, snap, REWARD_CATEGORY_PROPERTIES, REWARD_CATEGORY_COLLECTIONS);
      this.delegate.push("database.game.rewardCategories", obj);
      this.delegate.set("database.game.rewardCategoriesById." + rewardCategoryId, obj);
      this.listenForPropertyChanges_(
          snap.ref, REWARD_CATEGORY_PROPERTIES, REWARD_CATEGORY_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.game.rewardCategories." + this.getRewardCategoryIndex_(rewardCategoryId) + "." + property, value);
          });
      this.listenToRewardCategoryRewards_(gameId, rewardCategoryId);
    });
  }

  listenToRewardCategoryRewards_(gameId, rewardCategoryId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/rewardCategories/" + rewardCategoryId + "/rewards");
    ref.on("child_added", (snap) => {
      let rewardCategoryRewardId = snap.getKey();
      let obj = this.setupClientSideObject(rewardCategoryRewardId, snap, REWARD_CATEGORY_REWARD_PROPERTIES, REWARD_CATEGORY_REWARD_COLLECTIONS);
      this.delegate.push("database.game.rewardCategories." + this.getRewardCategoryIndex_(rewardCategoryId) + ".rewards", obj);
      this.delegate.set("database.game.rewardCategories." + this.getRewardCategoryIndex_(rewardCategoryId) + ".rewards." + rewardCategoryRewardId, obj);
      this.listenForPropertyChanges_(
          snap.ref, REWARD_CATEGORY_REWARD_PROPERTIES, REWARD_CATEGORY_REWARD_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.game.rewardCategories." + this.getRewardCategoryIndex_(rewardCategoryId) + ".rewards." + this.getRewardCategoryRewardIndex_(rewardCategoryId, rewardCategoryRewardId) + "." + property, value);
          });
    });
  }

  listenToSpecificGame(gameId) {
    this.firebaseRoot.child("games").on("child_added", (snap) => {
      if (snap.getKey() == gameId) {
        let obj = this.setupClientSideObject(gameId, snap, GAME_PROPERTIES, GAME_COLLECTIONS);
        this.delegate.set("database.game", obj);
        this.listenForPropertyChanges_(
            snap.ref, GAME_PROPERTIES, GAME_COLLECTIONS,
            (property, value) => {
              this.delegate.set("database.game." + property, value);
            });
        this.listenToMissions_(gameId);
        this.listenToChatRooms_(gameId);
        this.listenToPlayers_(gameId);
        this.listenToRewardCategories_(gameId);
        this.listenToNotificationCategories_(gameId);
      }
    });
  }

  listenToSpecificUser(userId) {
    this.firebaseRoot.child("users").on("child_added", (snap) => {
      if (snap.getKey() == userId) {
        let obj = this.setupClientSideObject(userId, snap, USER_PROPERTIES, USER_COLLECTIONS);
        this.delegate.set("database.user", obj);
        this.listenForPropertyChanges_(
            snap.ref, USER_PROPERTIES, USER_COLLECTIONS,
            (property, value) => {
              this.delegate.set("database.user." + property, value);
            });
        this.listenToUserPlayers_(userId);
      }
    });
  }

  listenToUserPlayers_(userId) {
    var ref = this.firebaseRoot.child("users/" + userId + "/players");
    ref.on("child_added", (snap) => {
      let userPlayerId = snap.getKey();
      let obj = this.setupClientSideObject(userPlayerId, snap, USER_PLAYER_PROPERTIES, USER_PLAYER_COLLECTIONS);
      this.delegate.push("database.user.players", obj);
      this.listenForPropertyChanges_(
          snap.ref, USER_PLAYER_PROPERTIES, USER_PLAYER_COLLECTIONS,
          (property, value) => {
            this.delegate.set("database.user.players." + this.getUserPlayerIndex_(userPlayerId) + "." + property, value);
          });
    });
  }
}