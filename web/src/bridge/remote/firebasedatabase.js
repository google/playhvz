'use strict';

const USER_PROPERTIES = ["placeholder"];
const USER_COLLECTIONS = ["players",];
const USER_PLAYER_PROPERTIES = ["gameId", "playerId"];
const USER_PLAYER_COLLECTIONS = [];
const GUN_PROPERTIES = ["number", "playerId"];
const GUN_COLLECTIONS = [];
const GAME_PROPERTIES = ["name", "number", "rulesUrl", "stunTimer"];
const GAME_COLLECTIONS = ["missions", "rewardCategories", "chatRooms", "players", "admins", "notificationCategories"];
const CHAT_ROOM_PROPERTIES = ["allegianceFilter", "name"];
const CHAT_ROOM_COLLECTIONS = ["messages", "memberships",];
const CHAT_ROOM_MEMBERSHIP_PROPERTIES = ["playerId"];
const CHAT_ROOM_MEMBERSHIP_COLLECTIONS = [];
const CHAT_ROOM_MESSAGE_PROPERTIES = ["index", "message", "playerId", "time"];
const CHAT_ROOM_MESSAGE_COLLECTIONS = [];
const MISSION_PROPERTIES = ["name", "beginTime", "endTime", "url", "allegianceFilter"];
const MISSION_COLLECTIONS = [];
const ADMIN_PROPERTIES = ["userId"];
const ADMIN_COLLECTIONS = [];
const NOTIFICATION_CATEGORY_PROPERTIES = ["name", "message", "previewMessage", "sendTime", "allegianceFilter", "email", "app", "sound", "vibrate", "destination", "icon"];
const NOTIFICATION_CATEGORY_COLLECTIONS = [];
const PLAYER_PROPERTIES = ["userId", "number", "allegiance", "infectable", "name", "needGun", "points", "profileImageUrl", "startAsZombie", "volunteer"];
const PLAYER_COLLECTIONS = ["infections", "lives", "rewards", "notifications",];
const PLAYER_REWARD_PROPERTIES = ["time", "rewardId", "rewardCategoryId"];
const PLAYER_REWARD_COLLECTIONS = [];
const PLAYER_LIFE_PROPERTIES = ["time", "code"];
const PLAYER_LIFE_COLLECTIONS = [];
const PLAYER_INFECTION_PROPERTIES = ["time", "infectorId"];
const PLAYER_INFECTION_COLLECTIONS = [];
const PLAYER_NOTIFICATION_PROPERTIES = ["message", "previewMessage", "notificationCategoryId", "seenTime", "sound", "vibrate", "app", "email", "destination"];
const PLAYER_NOTIFICATION_COLLECTIONS = [];
const REWARD_CATEGORY_PROPERTIES = ["name", "points", "seed", "claimed"];
const REWARD_CATEGORY_COLLECTIONS = ["rewards"];
const REWARD_CATEGORY_REWARD_PROPERTIES = ["playerId", "code"];
const REWARD_CATEGORY_REWARD_COLLECTIONS = [];

// Not sure why this HTMLImports.whenReady is really needed.
// Something about polymer initialization order.
// I think we"re not supposed to need this.
class FirebaseDatabase {
  constructor(config, delegate) {
    this.firebaseUser = null;
    this.delegate = delegate;
    this.firebaseRoot = null;
    this.userId = null;
    this.gameId = null;

    // Initialize Firebase
    firebase.initializeApp(config);

    this.firebaseRoot = firebase.app().database().ref();
  }

  attemptAutoSignIn() {
    return new Promise((resolve, reject) => {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          // User is signed in.
          this.setUser_(user);
          resolve(user.uid);
        } else {
          // No user is signed in
          reject();
        }
      });
    });
  }

  signIn() {
    return new Promise((resolve, reject) => {
      firebase.auth().getRedirectResult()
          .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // The signed-in user info.
            this.setUser_(result.user);
            // ...
  					resolve(result.user.uid);
          }).catch((error) => {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // The email of the user's account used.
            var email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;
            // ...
  					reject();
          });
  		var provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/plus.login');
  		firebase.auth().signInWithRedirect(provider);
    });
  }

  signOut() {
    firebase.auth().signOut()
        .then((result) => {
          alert("Signed out!");
          window.location.reload();
        }).catch((error) => {
          console.error(error);
        });
  }

  setUser_(user) {
    this.firebaseUser = user;
    this.userId = user.uid;
    this.listenToUsers(this.userId);
    this.shallowListenToGames();
    this.listenToGuns();
  }

  setGameId(gameId) {
    if (gameId && this.gameId) {
      throw "Cannot change game once selected, must refresh!";
    }
    if (gameId) {
      this.gameId = gameId;
      this.deepListenToGame(gameId);
    }
  }

  getGamePath_(gameId) {
    assert(typeof gameId == 'string' || gameId == null);
    let path = "games";
    if (gameId)
      path += "." + Utils.findIndexById(this.delegate.get(path), gameId);
    return path;
  }
  getGunPath_(gunId) {
    assert(typeof gunId == 'string' || gunId == null);
    let path = "guns";
    if (gunId)
      path += "." + Utils.findIndexById(this.delegate.get(path), gunId);
    return path;
  }
  getUserPath_(userId) {
    assert(typeof userId == 'string' || userId == null);
    let path = "users";
    if (userId)
      path += "." + Utils.findIndexById(this.delegate.get(path), userId);
    return path;
  }
  getUserPlayerPath_(userId, userPlayerId) {
    assert(userId);
    assert(typeof userPlayerId == 'string' || userPlayerId == null);
    let path = this.getUserPath_(userId) + ".players";
    if (userPlayerId)
      path += "." + Utils.findIndexById(this.delegate.get(path), userPlayerId);
    return path;
  }
  getPlayerPath_(gameId, playerId) {
    assert(gameId);
    assert(typeof playerId == 'string' || playerId == null);
    let path = this.getGamePath_(gameId) + ".players";
    if (playerId)
      path += "." + Utils.findIndexById(this.delegate.get(path), playerId);
    return path;
  }
  getPlayerRewardPath_(gameId, playerId, rewardId) {
    assert(gameId);
    assert(playerId);
    assert(typeof rewardId == 'string' || rewardId == null);
    let path = this.getPlayerPath_(gameId, playerId) + ".rewards";
    if (rewardId)
      path += "." + Utils.findIndexById(this.delegate.get(path), rewardId);
    return path;
  }
  getPlayerLifePath_(gameId, playerId, lifeId) {
    assert(gameId);
    assert(playerId);
    assert(typeof lifeId == 'string' || lifeId == null);
    let path = this.getPlayerPath_(gameId, playerId) + ".lives";
    if (lifeId)
      path += "." + Utils.findIndexById(this.delegate.get(path), lifeId);
    return path;
  }
  getPlayerInfectionPath_(gameId, playerId, infectionId) {
    assert(gameId);
    assert(playerId);
    assert(typeof infectionId == 'string' || infectionId == null);
    let path = this.getPlayerPath_(gameId, playerId) + ".infections";
    if (infectionId)
      path += "." + Utils.findIndexById(this.delegate.get(path), infectionId);
    return path;
  }
  getPlayerNotificationPath_(gameId, playerId, notificationId) {
    assert(gameId);
    assert(playerId);
    assert(typeof notificationId == 'string' || notificationId == null);
    let path = this.getPlayerPath_(gameId, playerId) + ".notifications";
    if (notificationId)
      path += "." + Utils.findIndexById(this.delegate.get(path), notificationId);
    return path;
  }
  getMissionPath_(gameId, missionId) {
    assert(gameId);
    assert(typeof missionId == 'string' || missionId == null);
    let path = this.getGamePath_(gameId) + ".missions";
    if (missionId)
      path += "." + Utils.findIndexById(this.delegate.get(path), missionId);
    return path;
  }
  getRewardCategoryPath_(gameId, rewardCategoryId) {
    assert(gameId);
    assert(typeof rewardCategoryId == 'string' || rewardCategoryId == null);
    let path = this.getGamePath_(gameId) + ".rewardCategories";
    if (rewardCategoryId)
      path += "." + Utils.findIndexById(this.delegate.get(path), rewardCategoryId);
    return path;
  }
  getRewardCategoryRewardPath_(gameId, rewardCategoryId, rewardId) {
    assert(gameId);
    assert(rewardCategoryId);
    assert(typeof rewardId == 'string' || rewardId == null);
    let path = this.getRewardCategoryPath_(gameId, rewardCategoryId) + ".rewards";
    if (rewardId)
      path += "." + Utils.findIndexById(this.delegate.get(path), rewardId);
    return path;
  }
  getNotificationCategoryPath_(gameId, notificationCategoryId) {
    assert(gameId);
    assert(typeof notificationCategoryId == 'string' || notificationCategoryId == null);
    let path = this.getGamePath_(gameId) + ".notificationCategories";
    if (notificationCategoryId)
      path += "." + Utils.findIndexById(this.delegate.get(path), notificationCategoryId);
    return path;
  }
  getChatRoomPath_(gameId, chatRoomId) {
    assert(gameId);
    assert(typeof chatRoomId == 'string' || chatRoomId == null);
    let path = this.getGamePath_(gameId) + ".chatRooms";
    if (chatRoomId)
      path += "." + Utils.findIndexById(this.delegate.get(path), chatRoomId);
    return path;
  }
  getChatRoomMembershipPath_(gameId, chatRoomId, membershipId) {
    assert(gameId);
    assert(chatRoomId);
    assert(typeof membershipId == 'string' || membershipId == null);
    let path = this.getChatRoomPath_(gameId, chatRoomId) + ".memberships";
    if (membershipId)
      path += "." + Utils.findIndexById(this.delegate.get(path), membershipId);
    return path;
  }
  getChatRoomMessagePath_(gameId, chatRoomId, messageId) {
    assert(gameId);
    assert(chatRoomId);
    assert(typeof messageId == 'string' || messageId == null);
    let path = this.getChatRoomPath_(gameId, chatRoomId) + ".messages";
    if (messageId)
      path += "." + Utils.findIndexById(this.delegate.get(path), messageId);
    return path;
  }
  // getPlayerIndex_(id) {
  //   if (!this.delegate.get("game") || !this.delegate.get("game.players")) {
  //     debugger;
  //   }
  // }
  // getPlayerNotificationIndex_(playerId, playerNotificationId) {
  // }
  // getChatRoomMembershipIndex_(chatRoomId, chatRoomMembershipId) {
  // }
  // getChatRoomMessageIndex_(chatRoomId, chatRoomMessageId) {
  // }

  // Figures out where we should insert an object in an array.
  // All objects must have "index" property to guide us.
  findInsertIndex(collection, newObjectIndex) {
    assert(collection);
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

  listenForDirectChildren_(collectionRef, properties, collections, setCallback) {
    collectionRef.on("child_added", (change) => {
      if (properties.includes(change.getKey())) {
        setCallback(change.getKey(), change.val());
      } else if (collections.find((col) => col == change.getKey())) {
        //setCallback(change.getKey(), []);
      } else {
        throwError("Unexpected child_added!", "Child key:", change.getKey(), "Child value:", change.val(), arguments);
      }
    });
    collectionRef.on("child_changed", (change) => {
      if (properties.includes(change.getKey())) {
        setCallback(change.getKey(), change.val());
      } else if (collections.find((col) => col == change.getKey())) {
        // do nothing, covered elsewhere
      } else {
        throwError("Unexpected child_changed!", "Child key:", change.getKey(), "Child value:", change.val(), arguments);
      }
    });
    collectionRef.on("child_removed", (change) => {
      if (properties.includes(change.getKey())) {
        setCallback(change.getKey(), null);
      } else if (collections.find((col) => col == change.getKey())) {
        setCallback(change.getKey(), []);
      } else {
        throwError("Unexpected!", change.val(), change.getKey(), arguments);
      }
    });
  }

  copyProperties(object, snapshotValue, propertyNames) {
    for (let propertyName of propertyNames) {
      let val = snapshotValue[propertyName];
      if (val === undefined)
        val = null;
      object[propertyName] = val;
    }
    return object;
  }
  addEmptyLists(object, lists) {
    for (let listName of lists) {
      object[listName] = [];
    }
    return object;
  }

  shallowListenToGames() {
    this.firebaseRoot.child("games").on("child_added", (snap) => {
      let gameId = snap.getKey();
      let obj = {id: gameId};
      obj = this.copyProperties(obj, snap.val(), GAME_PROPERTIES);
      obj = this.addEmptyLists(obj, GAME_COLLECTIONS);
      this.delegate.push(this.getGamePath_(), obj);
      this.listenForDirectChildren_(
          snap.ref, GAME_PROPERTIES, GAME_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getGamePath_(gameId) + "." + property, value);
          });
    });
    this.firebaseRoot.child(this.getGamePath_()).on("child_removed", (snap) => {
      this.splice(this.getGamePath_(), this.getGameIndex_(snap.getKey()), 1);
    });
  }

  deepListenToGame(gameId) {
    this.listenToMissions_(gameId);
    this.listenToChatRooms_(gameId);
    this.listenToPlayers_(gameId);
    this.listenToRewardCategories_(gameId);
    this.listenToNotificationCategories_(gameId);
  }

  listenToGuns() {
    this.firebaseRoot.child("guns").on("child_added", (snap) => {
      let gunId = snap.getKey();
      let obj = {id: gunId};
      obj = this.copyProperties(obj, snap.val(), GUN_PROPERTIES);
      obj = this.addEmptyLists(obj, GUN_COLLECTIONS);
      this.delegate.push(this.getGunPath_(null), obj);
      this.listenForDirectChildren_(
          snap.ref, GUN_PROPERTIES, GUN_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getGunPath_(gunId) + "." + property, value);
          });
    });
  }

  listenToMissions_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/missions");
    ref.on("child_added", (snap) => {
      let missionId = snap.getKey();
      let obj = {id: missionId};
      obj = this.copyProperties(obj, snap.val(), MISSION_PROPERTIES);
      obj = this.addEmptyLists(obj, MISSION_COLLECTIONS);
      assert(this.delegate.get(this.getMissionPath_(gameId)) != null);
      this.delegate.push(this.getMissionPath_(gameId, null), obj);
      this.listenForDirectChildren_(
          snap.ref, MISSION_PROPERTIES, MISSION_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getMissionPath_(gameId, missionId) + "." + property, value);
          });
    });
  }

  listenToAdmins_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/admins");
    ref.on("child_added", (snap) => {
      let adminId = snap.getKey();
      let obj = {id: adminId};
      obj = this.copyProperties(obj, snap.val(), ADMIN_PROPERTIES);
      obj = this.addEmptyLists(obj, ADMIN_COLLECTIONS);
      this.delegate.push(this.getAdminPath_(gameId, null), obj);
      this.listenForDirectChildren_(
          snap.ref, ADMIN_PROPERTIES, ADMIN_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getAdminPath_(gameId, adminId) + "." + property, value);
          });
    });
  }

  listenToChatRooms_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/chatRooms");
    ref.on("child_added", (snap) => {
      let chatRoomId = snap.getKey();
      let obj = {id: chatRoomId};
      obj = this.copyProperties(obj, snap.val(), CHAT_ROOM_PROPERTIES);
      obj = this.addEmptyLists(obj, CHAT_ROOM_COLLECTIONS);
      this.delegate.push(this.getChatRoomPath_(gameId, null), obj);
      this.listenForDirectChildren_(
          snap.ref, CHAT_ROOM_PROPERTIES, CHAT_ROOM_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getChatRoomPath_(gameId, chatRoomId) + "." + property, value);
          });
      this.listenToChatRoomMemberships_(gameId, chatRoomId);
      this.listenToChatRoomMessages_(gameId, chatRoomId);
    });
  }

  listenToChatRoomMemberships_(gameId, chatRoomId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/chatRooms/" + chatRoomId + "/memberships");
    ref.on("child_added", (snap) => {
      let chatRoomMembershipId = snap.getKey();
      let obj = {id: chatRoomMembershipId};
      obj = this.copyProperties(obj, snap.val(), CHAT_ROOM_MEMBERSHIP_PROPERTIES);
      obj = this.addEmptyLists(obj, CHAT_ROOM_MEMBERSHIP_COLLECTIONS);
      this.delegate.push(this.getChatRoomPath_(gameId, chatRoomId, null) + ".memberships", obj);
      this.listenForDirectChildren_(
          snap.ref, CHAT_ROOM_MEMBERSHIP_PROPERTIES, CHAT_ROOM_MEMBERSHIP_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getChatRoomMembershipPath_(gameId, chatRoomId, chatRoomMembershipId) + "." + property, value);
          });
    });
  }

  listenToChatRoomMessages_(gameId, chatRoomId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/chatRooms/" + chatRoomId + "/messages");
    ref.on("child_added", (snap) => {
      let chatRoomMessageId = snap.getKey();
      let obj = {id: chatRoomMessageId};
      obj = this.copyProperties(obj, snap.val(), CHAT_ROOM_MESSAGE_PROPERTIES);
      obj = this.addEmptyLists(obj, CHAT_ROOM_MESSAGE_COLLECTIONS);
      let insertIndex =
          this.findInsertIndex(
              this.delegate.get(this.getChatRoomPath_(gameId, chatRoomId) + ".messages"),
              obj.index);
      this.delegate.splice(
          this.getChatRoomMessagePath_(gameId, chatRoomId),
          insertIndex, 0, obj);
      this.listenForDirectChildren_(
          snap.ref, CHAT_ROOM_MESSAGE_PROPERTIES, CHAT_ROOM_MESSAGE_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getChatRoomMessagePath_(gameId, chatRoomId, chatRoomMessageId) + "." + property, value);
          });
    });
  }

  listenToPlayers_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players");
    ref.on("child_added", (snap) => {
      let playerId = snap.getKey();
      let obj = {id: playerId};
      obj = this.copyProperties(obj, snap.val(), PLAYER_PROPERTIES);
      obj = this.addEmptyLists(obj, PLAYER_COLLECTIONS);
      this.delegate.push(this.getPlayerPath_(gameId, null), obj);
      this.listenForDirectChildren_(
          snap.ref, PLAYER_PROPERTIES, PLAYER_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getPlayerPath_(gameId, playerId) + "." + property, value);
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
      let obj = {id: playerRewardId};
      obj = this.copyProperties(obj, snap.val(), PLAYER_REWARD_PROPERTIES);
      obj = this.addEmptyLists(obj, PLAYER_REWARD_COLLECTIONS);
      this.delegate.push(this.getPlayerRewardPath_(gameId, playerId, null), obj);
      this.listenForDirectChildren_(
          snap.ref, PLAYER_REWARD_PROPERTIES, PLAYER_REWARD_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getPlayerRewardPath_(gameId, playerId, playerRewardId) + "." + property, value);
          });
    });
  }

  listenToPlayerLives_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/lives");
    ref.on("child_added", (snap) => {
      let playerLifeId = snap.getKey();
      let obj = {id: playerLifeId};
      obj = this.copyProperties(obj, snap.val(), PLAYER_LIFE_PROPERTIES);
      obj = this.addEmptyLists(obj, PLAYER_LIFE_COLLECTIONS);
      this.delegate.push(this.getPlayerLifePath_(gameId, playerId, null), obj);
      this.listenForDirectChildren_(
          snap.ref, PLAYER_LIFE_PROPERTIES, PLAYER_LIFE_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getPlayerLifePath_(gameId, playerId, playerLifeId) + "." + property, value);
          });
    });
  }

  listenToPlayerInfections_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/infections");
    ref.on("child_added", (snap) => {
      let playerInfectionId = snap.getKey();
      let obj = {id: playerInfectionId};
      obj = this.copyProperties(obj, snap.val(), PLAYER_INFECTION_PROPERTIES);
      obj = this.addEmptyLists(obj, PLAYER_INFECTION_COLLECTIONS);
      this.delegate.push(this.getPlayerInfectionPath_(gameId, playerId, null), obj);
      this.listenForDirectChildren_(
          snap.ref, PLAYER_INFECTION_PROPERTIES, PLAYER_INFECTION_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getPlayerInfectionPath_(gameId, playerId, playerInfectionId) + "." + property, value);
          });
    });
  }

  listenToPlayerNotifications_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/notifications");
    ref.on("child_added", (snap) => {
      let playerNotificationId = snap.getKey();
      let obj = {id: playerNotificationId};
      obj = this.copyProperties(obj, snap.val(), PLAYER_NOTIFICATION_PROPERTIES);
      obj = this.addEmptyLists(obj, PLAYER_NOTIFICATION_COLLECTIONS);
      this.delegate.push(this.getPlayerNotificationPath_(gameId, playerId, null), obj);
      this.listenForDirectChildren_(
          snap.ref, PLAYER_NOTIFICATION_PROPERTIES, PLAYER_NOTIFICATION_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getPlayerNotificationPath_(gameId, playerId, playerNotificationId) + "." + property, value);
          });
    });
  }

  listenToNotificationCategories_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/notificationCategories");
    ref.on("child_added", (snap) => {
      let notificationCategoryId = snap.getKey();
      let obj = {id: notificationCategoryId};
      obj = this.copyProperties(obj, snap.val(), NOTIFICATION_CATEGORY_PROPERTIES);
      obj = this.addEmptyLists(obj, NOTIFICATION_CATEGORY_COLLECTIONS);
      this.delegate.push(this.getNotificationCategoryPath_(gameId, null), obj);
      this.listenForDirectChildren_(
          snap.ref, NOTIFICATION_CATEGORY_PROPERTIES, NOTIFICATION_CATEGORY_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getNotificationCategoryPath_(gameId, notificationCategoryId) + "." + property, value);
          });
    });
  }

  listenToRewardCategories_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/rewardCategories");
    ref.on("child_added", (snap) => {
      let rewardCategoryId = snap.getKey();
      let obj = {id: rewardCategoryId};
      obj = this.copyProperties(obj, snap.val(), REWARD_CATEGORY_PROPERTIES);
      obj = this.addEmptyLists(obj, REWARD_CATEGORY_COLLECTIONS);
      this.delegate.push(this.getRewardCategoryPath_(gameId, null), obj);
      this.listenForDirectChildren_(
          snap.ref, REWARD_CATEGORY_PROPERTIES, REWARD_CATEGORY_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getRewardCategoryPath_(gameId, rewardCategoryId) + "." + property, value);
          });
      this.listenToRewardCategoryRewards_(gameId, rewardCategoryId);
    });
  }

  listenToRewardCategoryRewards_(gameId, rewardCategoryId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/rewardCategories/" + rewardCategoryId + "/rewards");
    ref.on("child_added", (snap) => {
      let rewardCategoryRewardId = snap.getKey();
      let obj = {id: rewardCategoryRewardId};
      obj = this.copyProperties(obj, snap.val(), REWARD_CATEGORY_REWARD_PROPERTIES);
      obj = this.addEmptyLists(obj, REWARD_CATEGORY_REWARD_COLLECTIONS);
      this.delegate.push(this.getRewardCategoryRewardPath_(gameId, rewardCategoryId, null), obj);
      this.listenForDirectChildren_(
          snap.ref, REWARD_CATEGORY_REWARD_PROPERTIES, REWARD_CATEGORY_REWARD_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getRewardCategoryRewardPath_(gameId, rewardCategoryId, rewardCategoryRewardId) + "." + property, value);
          });
    });
  }

  listenToUsers() {
    this.firebaseRoot.child("users").on("child_added", (snap) => {
      let userId = snap.getKey();
      let obj = {id: userId};
      obj = this.copyProperties(obj, snap.val(), USER_PROPERTIES);
      obj = this.addEmptyLists(obj, USER_COLLECTIONS);
      this.delegate.push(this.getUserPath_(null), obj);
      this.listenForDirectChildren_(
          snap.ref, USER_PROPERTIES, USER_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getUserPath_(userId) + "." + property, value);
          });
      this.listenToUserPlayers_(userId);
    });
  }

  listenToUserPlayers_(userId) {
    var ref = this.firebaseRoot.child("users/" + userId + "/players");
    ref.on("child_added", (snap) => {
      let userPlayerId = snap.getKey();
      let obj = {id: userPlayerId};
      obj = this.copyProperties(obj, snap.val(), USER_PLAYER_PROPERTIES);
      obj = this.addEmptyLists(obj, USER_PLAYER_COLLECTIONS);
      this.delegate.push(this.getUserPlayerPath_(userId, null), obj);
      this.listenForDirectChildren_(
          snap.ref, USER_PLAYER_PROPERTIES, USER_PLAYER_COLLECTIONS,
          (property, value) => {
            this.delegate.set(this.getUserPlayerPath_(userId, userPlayerId) + "." + property, value);
          });
    });
  }
}
