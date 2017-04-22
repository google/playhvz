'use strict';

class FirebaseListener {
  constructor(localDb, firebaseRoot) {
    this.localDb = localDb;
    this.firebaseRoot = firebaseRoot;
    this.shallowListenToGames();
    this.listenToGuns();
  }
  listenToGame(gameId) {
    this.deepListenToGame(gameId);
    this.listenToGame = () => throwError("Can't call listenToGame twice!");
  }
  listenToUser(userId) {
    this.deepListenToUser(userId);
    this.listenToUser = () => throwError("Can't call listenToUser twice!");
  }

  listenForPropertyChanges_(collectionRef, properties, collections, setCallback) {
    collectionRef.on("child_added", (change) => {
      if (properties.includes(change.getKey())) {
        setCallback(change.getKey(), change.val());
      } else {
        assert(
            collections.find((col) => col == change.getKey()),
            "Unexpected child_added!", "Child key:", change.getKey(), "Child value:", change.val(), arguments);
      }
    });
    collectionRef.on("child_changed", (change) => {
      if (properties.includes(change.getKey())) {
        setCallback(change.getKey(), change.val());
      } else {
        assert(
            collections.find((col) => col == change.getKey()),
            "Unexpected child_changed!", "Child key:", change.getKey(), "Child value:", change.val(), arguments);
      }
    });
    collectionRef.on("child_removed", (change) => {
      if (properties.includes(change.getKey())) {
        setCallback(change.getKey(), null);
      } else {
        assert(
            collections.find((col) => col == change.getKey()),
            "Unexpected!", change.val(), change.getKey(), arguments);
      }
    });
  }

  listenToGuns() {
    this.firebaseRoot.child("guns").on("child_added", (snap) => {
      let gunId = snap.getKey();
      let obj = newGun(gunId, snap.val());
      this.localDb.insert(this.localDb.getGunPath_(null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, GUN_PROPERTIES, GUN_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getGunPath_(gunId).concat([property]), value);
          });
    });
  }

  listenToUserPlayers_(userId) {
    var ref = this.firebaseRoot.child("users/" + userId + "/players");
    ref.on("child_added", (snap) => {
      let userPlayerId = snap.getKey();
      let obj = newUserPlayer(userPlayerId, snap.val());
      this.localDb.insert(this.localDb.getUserPlayerPath_(userId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, USER_PLAYER_PROPERTIES, USER_PLAYER_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getUserPlayerPath_(userId, userPlayerId).concat([property]), value);
          });
    });
  }

  shallowListenToGames() {
    this.firebaseRoot.child("games").on("child_added", (snap) => {
      let gameId = snap.getKey();
      let obj = newGame(gameId, snap.val());
      this.localDb.insert(this.localDb.getGamePath_(null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, GAME_PROPERTIES, GAME_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getGamePath_(gameId).concat([property]), value);
          });
    });
    this.firebaseRoot.child("games").on("child_removed", (snap) => {
      this.splice(this.localDb.getGamePath_(), this.localDb.getGameIndex_(snap.getKey()), 1);
    });
  }

  deepListenToGame(gameId) {
    this.listenToAdmins_(gameId);
    this.listenToMissions_(gameId);
    this.listenToChatRooms_(gameId);
    this.listenToQuizQuestions_(gameId);
    this.listenToPlayers_(gameId);
    this.listenToRewardCategories_(gameId);
    this.listenToNotificationCategories_(gameId);
  }

  // listenToUsers() {
  //   this.firebaseRoot.child("users").on("child_added", (snap) => {
  //     let userId = snap.getKey();
  //     let obj = newUser(userId, snap.val());
  //     this.localDb.insert(this.localDb.getUserPath_(null), obj, null);
  //     this.listenForPropertyChanges_(
  //         snap.ref, USER_PROPERTIES, USER_COLLECTIONS,
  //         (property, value) => {
  //           this.localDb.set(this.localDb.getUserPath_(userId).concat([property]), value);
  //         });
  //     this.listenToUserPlayers_(userId);
  //   });
  // }

  deepListenToUser(userId) {
    let ref = this.firebaseRoot.child("users/" + userId);
    ref.once("value").then((snap) => {
      let obj = newUser(userId, snap.val());
      this.localDb.insert(this.localDb.getUserPath_(null), obj, null);
      this.listenForPropertyChanges_(
          ref, USER_PROPERTIES, USER_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getUserPath_(userId).concat([property]), value);
          });
      this.listenToUserPlayers_(userId);
    });
  }

  listenToMissions_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/missions");
    ref.on("child_added", (snap) => {
      let missionId = snap.getKey();
      let obj = newMission(missionId, snap.val());
      this.localDb.insert(this.localDb.getMissionPath_(gameId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, MISSION_PROPERTIES, MISSION_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getMissionPath_(gameId, missionId).concat([property]), value);
          });
    });
  }

  listenToAdmins_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/admins");
    ref.on("child_added", (snap) => {
      let adminId = snap.getKey();
      let obj = newAdmin(adminId, snap.val());
      this.localDb.insert(this.localDb.getAdminPath_(gameId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, ADMIN_PROPERTIES, ADMIN_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getAdminPath_(gameId, adminId).concat([property]), value);
          });
    });
  }

  listenToQuizQuestions_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/quizQuestions");
    ref.on("child_added", (snap) => {
      let quizQuestionId = snap.getKey();
      let obj = newQuizQuestion(quizQuestionId, snap.val());
      this.localDb.insert(this.localDb.getQuizQuestionPath_(gameId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, QUIZ_QUESTION_PROPERTIES, QUIZ_QUESTION_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getQuizQuestionPath_(gameId, quizQuestionId).concat([property]), value);
          });
      this.listenToQuizAnswers_(gameId, quizQuestionId);
    });
  }

  listenToQuizAnswers_(gameId, quizQuestionId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/quizQuestions/" + quizQuestionId + "/answers");
    ref.on("child_added", (snap) => {
      let quizAnswerId = snap.getKey();
      let obj = newQuizAnswer(quizAnswerId, snap.val());
      this.localDb.insert(this.localDb.getQuizAnswerPath_(gameId, quizQuestionId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, QUIZ_ANSWER_PROPERTIES, QUIZ_ANSWER_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getQuizAnswerPath_(gameId, quizQuestionId, quizAnswerId).concat([property]), value);
          });
    });
  }

  listenToChatRooms_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/chatRooms");
    ref.on("child_added", (snap) => {
      let chatRoomId = snap.getKey();
      let obj = newChatRoom(chatRoomId, snap.val());
      this.localDb.insert(this.localDb.getChatRoomPath_(gameId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, CHAT_ROOM_PROPERTIES, CHAT_ROOM_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getChatRoomPath_(gameId, chatRoomId).concat([property]), value);
          });
      this.listenToChatRoomMemberships_(gameId, chatRoomId);
      this.listenToChatRoomMessages_(gameId, chatRoomId);
    });
  }

  listenToChatRoomMemberships_(gameId, chatRoomId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/chatRooms/" + chatRoomId + "/memberships");
    ref.on("child_added", (snap) => {
      let chatRoomMembershipId = snap.getKey();
      let obj = newMembership(chatRoomMembershipId, snap.val());
      this.localDb.insert(this.localDb.getChatRoomMembershipPath_(gameId, chatRoomId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, MEMBERSHIP_PROPERTIES, MEMBERSHIP_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getChatRoomMembershipPath_(gameId, chatRoomId, chatRoomMembershipId).concat([property]), value);
          });
    });
  }

  listenToChatRoomMessages_(gameId, chatRoomId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/chatRooms/" + chatRoomId + "/messages");
    ref.on("child_added", (snap) => {
      let chatRoomMessageId = snap.getKey();
      let obj = newMessage(chatRoomMessageId, snap.val());
      let insertIndex =
          Utils.findInsertIndex(
              this.localDb.get(this.localDb.getChatRoomMessagePath_(gameId, chatRoomId, null)),
              obj.index);
      this.localDb.insert(
          this.localDb.getChatRoomMessagePath_(gameId, chatRoomId),
          obj,
          insertIndex);
      this.listenForPropertyChanges_(
          snap.ref, MESSAGE_PROPERTIES, MESSAGE_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getChatRoomMessagePath_(gameId, chatRoomId, chatRoomMessageId).concat([property]), value);
          });
    });
  }

  listenToPlayers_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players");
    ref.on("child_added", (snap) => {
      let playerId = snap.getKey();
      let obj = newPlayer(playerId, snap.val());
      this.localDb.insert(this.localDb.getPlayerPath_(gameId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, PLAYER_PROPERTIES, PLAYER_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getPlayerPath_(gameId, playerId).concat([property]), value);
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
      let obj = newPlayerReward(playerRewardId, snap.val());
      this.localDb.insert(this.localDb.getPlayerRewardPath_(gameId, playerId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, PLAYER_REWARD_PROPERTIES, PLAYER_REWARD_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getPlayerRewardPath_(gameId, playerId, playerRewardId).concat([property]), value);
          });
    });
  }

  listenToPlayerLives_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/lives");
    ref.on("child_added", (snap) => {
      let playerLifeId = snap.getKey();
      let obj = newLife(playerLifeId, snap.val());
      this.localDb.insert(this.localDb.getPlayerLifePath_(gameId, playerId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, LIFE_PROPERTIES, LIFE_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getPlayerLifePath_(gameId, playerId, playerLifeId).concat([property]), value);
          });
    });
  }

  listenToPlayerInfections_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/infections");
    ref.on("child_added", (snap) => {
      let playerInfectionId = snap.getKey();
      let obj = newInfection(playerInfectionId, snap.val());
      this.localDb.insert(this.localDb.getPlayerInfectionPath_(gameId, playerId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, INFECTION_PROPERTIES, INFECTION_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getPlayerInfectionPath_(gameId, playerId, playerInfectionId).concat([property]), value);
          });
    });
  }

  listenToPlayerNotifications_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/notifications");
    ref.on("child_added", (snap) => {
      let playerNotificationId = snap.getKey();
      let obj = newNotification(playerNotificationId, snap.val());
      this.localDb.insert(this.localDb.getPlayerNotificationPath_(gameId, playerId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, NOTIFICATION_PROPERTIES, NOTIFICATION_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getPlayerNotificationPath_(gameId, playerId, playerNotificationId).concat([property]), value);
          });
    });
  }

  listenToNotificationCategories_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/notificationCategories");
    ref.on("child_added", (snap) => {
      let notificationCategoryId = snap.getKey();
      let obj = newNotificationCategory(notificationCategoryId, snap.val());
      this.localDb.insert(this.localDb.getNotificationCategoryPath_(gameId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, NOTIFICATION_CATEGORY_PROPERTIES, NOTIFICATION_CATEGORY_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getNotificationCategoryPath_(gameId, notificationCategoryId).concat([property]), value);
          });
    });
  }

  listenToRewardCategories_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/rewardCategories");
    ref.on("child_added", (snap) => {
      let rewardCategoryId = snap.getKey();
      let obj = newRewardCategory(rewardCategoryId, snap.val());
      this.localDb.insert(this.localDb.getRewardCategoryPath_(gameId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, REWARD_CATEGORY_PROPERTIES, REWARD_CATEGORY_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getRewardCategoryPath_(gameId, rewardCategoryId).concat([property]), value);
          });
      this.listenToRewardCategoryRewards_(gameId, rewardCategoryId);
    });
  }

  listenToRewardCategoryRewards_(gameId, rewardCategoryId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/rewardCategories/" + rewardCategoryId + "/rewards");
    ref.on("child_added", (snap) => {
      let rewardCategoryRewardId = snap.getKey();
      let obj = newReward(rewardCategoryRewardId, snap.val());
      this.localDb.insert(this.localDb.getRewardCategoryRewardPath_(gameId, rewardCategoryId, null), obj, null);
      this.listenForPropertyChanges_(
          snap.ref, REWARD_PROPERTIES, REWARD_COLLECTIONS,
          (property, value) => {
            this.localDb.set(this.localDb.getRewardCategoryRewardPath_(gameId, rewardCategoryId, rewardCategoryRewardId).concat([property]), value);
          });
    });
  }
}
