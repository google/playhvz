'use strict';

class FirebaseListener {
  constructor(farWriter, firebaseRoot) {

    this.gatedFarWriter = new GatedWriter(farWriter, true);

    let nearPincushion = {};

    this.writer =
        new TeeWriter(
            new MappingWriter(new SimpleWriter(nearPincushion)),
            new MappingWriter(this.gatedFarWriter));

    this.nearReader = new Reader(new SimpleReader(nearPincushion));
    this.checker = new ConsistencyChecker(this.nearReader);

    this.gatedFarWriter.closeGate();
    this.writer.set(this.nearReader.getGunPath(null), []);
    this.writer.set(this.nearReader.getGamePath(null), []);
    this.writer.set(this.nearReader.getUserPath(null), []);
    this.gatedFarWriter.openGate();

    this.consistencyDefeatTimeout = null;

    this.firebaseRoot = firebaseRoot;
  }
  listenToGame(gameId) {
    this.deepListenToGame(gameId);
    this.listenToGame = () => throwError("Can't call listenToGame twice!");
  }
  listenToUser(userId) {
    this.deepListenToUser(userId);
    this.shallowListenToGames();
    this.listenToGuns();
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

  // Closes the gate, checks the write, and if the write didn't break
  // anything, then reopen the gate.
  // Doesn't reopen the gate if it was already closed.
  gatedWrite(write, wasConsistentWrite) {
    let wasOpen = this.gatedFarWriter.isGateOpen();
    if (wasOpen) {
      this.gatedFarWriter.closeGate();
      write();
      if (wasConsistentWrite()) {
        // Gate was open before, and it was a consistent write, yay!
        this.gatedFarWriter.openGate();
      } else {
        // Gate was open before, but now we're inconsistent, shoot.
        setTimeout(() => {
          if (this.checker.checkConsistency()) {
            // We checked again, and something in the same batch of firebase
            // requests made things consistent, yay!
            this.gatedFarWriter.openGate();
          } else {
            // Nope, something in this batch borked our consistency.
            this.consistencyDefeatTimeout =
                setTimeout(
                    () => {
                      console.error("Not eventually consistent!", this.gatedFarWriter);
                      new ConsistencyChecker(this.nearReader, true)
                          .checkConsistency();
                    },
                    2000);
          }
        }, 0);
      }
    } else {
      write();
      if (this.checker.checkConsistency()) {
        // Wasn't open before, and is now consistent, yay!
        this.gatedFarWriter.openGate();
        clearTimeout(this.consistencyDefeatTimeout);
        this.consistencyDefeatTimeout = null;
      } else {
        // Wasn't open before, and still isnt consistent... carry on.
      }
    }
  }

  listenToGuns() {
    this.firebaseRoot.child("guns").on("child_added", (snap) => {
      let gunId = snap.getKey();
      let obj = newGun(gunId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getGunPath(null), null, obj),
          () => this.checker.checkGunConsistent(gunId));
      this.listenForPropertyChanges_(
          snap.ref, GUN_PROPERTIES, GUN_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getGunPath(gunId).concat([property]), value),
                () => this.checker.checkGunConsistent(gunId));
          });
    });
  }

  listenToUserPlayers_(userId) {
    var ref = this.firebaseRoot.child("users/" + userId + "/players");
    ref.on("child_added", (snap) => {
      let playerId = snap.getKey();
      let obj = newUserPlayer(playerId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getUserPlayerPath(userId, null), null, obj),
          () => this.checker.checkPlayerConsistent(playerId));
      this.listenForPropertyChanges_(
          snap.ref, USER_PLAYER_PROPERTIES, USER_PLAYER_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getUserPlayerPath(userId, playerId).concat([property]), value),
                () => this.checker.checkPlayerConsistent(playerId));
          });
    });
  }

  shallowListenToGames() {
    this.firebaseRoot.child("games").on("child_added", (snap) => {
      let gameId = snap.getKey();
      let obj = newGame(gameId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getGamePath(null), null, obj),
          () => this.checker.checkGameConsistent(gameId));
      this.listenForPropertyChanges_(
          snap.ref, GAME_PROPERTIES, GAME_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getGamePath(gameId).concat([property]), value),
                () => this.checker.checkGameConsistent(gameId));
          });
    });
    this.firebaseRoot.child("games").on("child_removed", (snap) => {
      this.splice(this.nearReader.getGamePath(), this.nearReader.getGameIndex(snap.getKey()), 1);
    });
  }

  deepListenToGame(gameId) {
    this.listenToPlayers_(gameId);
    this.listenToAdmins_(gameId);
    this.listenToMissions_(gameId);
    this.listenToChatRooms_(gameId);
    this.listenToQuizQuestions_(gameId);
    this.listenToRewardCategories_(gameId);
    this.listenToNotificationCategories_(gameId);
  }

  deepListenToUser(userId) {
    let ref = this.firebaseRoot.child("users/" + userId);
    ref.once("value").then((snap) => {
      let obj = newUser(userId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getUserPath(null), null, obj),
          () => this.checker.checkUserConsistent(userId));
      this.listenForPropertyChanges_(
          ref, USER_PROPERTIES, USER_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getUserPath(userId).concat([property]), value),
                () => this.checker.checkUserConsistent(userId));
          });
      this.listenToUserPlayers_(userId);
    });
  }

  listenToAdmins_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/admins");
    ref.on("child_added", (snap) => {
      let adminId = snap.getKey();
      let obj = newAdmin(adminId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getAdminPath(gameId, null), null, obj),
          () => this.checker.checkAdminConsistent(gameId, adminId));
      this.listenForPropertyChanges_(
          snap.ref, ADMIN_PROPERTIES, ADMIN_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getAdminPath(gameId, adminId).concat([property]), value),
                () => this.checker.checkAdminConsistent(gameId, adminId));
          });
    });
  }

  listenToQuizQuestions_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/quizQuestions");
    ref.on("child_added", (snap) => {
      let quizQuestionId = snap.getKey();
      let obj = newQuizQuestion(quizQuestionId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getQuizQuestionPath(gameId, null), null, obj),
          () => this.checker.checkQuizQuestionConsistent(quizQuestionId));
      this.listenForPropertyChanges_(
          snap.ref, QUIZ_QUESTION_PROPERTIES, QUIZ_QUESTION_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getQuizQuestionPath(gameId, quizQuestionId).concat([property]), value),
                () => this.checker.checkQuizQuestionConsistent(quizQuestionId));
          });
      this.listenToQuizAnswers_(gameId, quizQuestionId);
    });
  }

  listenToQuizAnswers_(gameId, quizQuestionId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/quizQuestions/" + quizQuestionId + "/answers");
    ref.on("child_added", (snap) => {
      let quizAnswerId = snap.getKey();
      let obj = newQuizAnswer(quizAnswerId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getQuizAnswerPath(gameId, quizQuestionId, null), null, obj),
          () => this.checker.checkQuizAnswerConsistent(quizAnswerId));
      this.listenForPropertyChanges_(
          snap.ref, QUIZ_ANSWER_PROPERTIES, QUIZ_ANSWER_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getQuizAnswerPath(gameId, quizQuestionId, quizAnswerId).concat([property]), value),
                () => this.checker.checkQuizAnswerConsistent(quizAnswerId));
          });
    });
  }

  listenToMissions_(gameId) {
    var collectionRef = this.firebaseRoot.child("games/" + gameId + "/missionIds");
    collectionRef.on("child_added", (snap) => {
      let missionId = snap.getKey(); // snap.val() is ""
      let ref = this.firebaseRoot.child("missions/" + missionId);
      ref.once("value").then((snap) => {
        let obj = newMission(missionId, snap.val());
        this.gatedWrite(
            () => this.writer.insert(this.nearReader.getMissionPath(gameId, null), null, obj),
            () => this.checker.checkMissionConsistent(missionId));
        this.listenForPropertyChanges_(
            snap.ref, MISSION_PROPERTIES, MISSION_COLLECTIONS,
            (property, value) => {
              this.gatedWrite(
                  () => this.writer.set(this.nearReader.getMissionPath(gameId, missionId).concat([property]), value),
                  () => this.checker.checkMissionConsistent(missionId));
            });
      });
    });
  }

  listenToChatRooms_(gameId) {
    var collectionRef = this.firebaseRoot.child("games/" + gameId + "/chatRoomIds");
    collectionRef.on("child_added", (snap) => {
      let chatRoomId = snap.getKey(); // snap.val() is ""
      let ref = this.firebaseRoot.child("chatRooms/" + chatRoomId);
      ref.once("value").then((snap) => {
        let obj = newChatRoom(chatRoomId, snap.val());
        this.gatedWrite(
            () => this.writer.insert(this.nearReader.getChatRoomPath(gameId, null), null, obj),
            () => this.checker.checkChatRoomConsistent(chatRoomId));
        this.listenForPropertyChanges_(
            snap.ref, CHAT_ROOM_PROPERTIES, CHAT_ROOM_COLLECTIONS,
            (property, value) => {
              this.gatedWrite(
                  () => this.writer.set(this.nearReader.getChatRoomPath(gameId, chatRoomId).concat([property]), value),
                  () => this.checker.checkChatRoomConsistent(chatRoomId));
            });
        this.listenToChatRoomMemberships_(gameId, chatRoomId);
        this.listenToChatRoomMessages_(gameId, chatRoomId);
      });
    });
  }

  listenToNotificationCategories_(gameId) {
    var collectionRef = this.firebaseRoot.child("games/" + gameId + "/notificationCategoryIds");
    collectionRef.on("child_added", (snap) => {
      let notificationCategoryId = snap.getKey(); // snap.val() is ""
      let ref = this.firebaseRoot.child("notificationCategories/" + notificationCategoryId);
      ref.once("value").then((snap) => {
        let obj = newNotificationCategory(notificationCategoryId, snap.val());
        this.gatedWrite(
            () => this.writer.insert(this.nearReader.getNotificationCategoryPath(gameId, null), null, obj),
            () => this.checker.checkNotificationCategoryConsistent(notificationCategoryId));
        this.listenForPropertyChanges_(
            snap.ref, CHAT_ROOM_PROPERTIES, CHAT_ROOM_COLLECTIONS,
            (property, value) => {
              this.gatedWrite(
                  () => this.writer.set(this.nearReader.getNotificationCategoryPath(gameId, notificationCategoryId).concat([property]), value),
                  () => this.checker.checkNotificationCategoryConsistent(notificationCategoryId));
            });
      });
    });
  }

  listenToChatRoomMemberships_(gameId, chatRoomId) {
    var ref = this.firebaseRoot.child("/chatRooms/" + chatRoomId + "/memberships");
    ref.on("child_added", (snap) => {
      let membershipId = snap.getKey();
      let obj = newMembership(membershipId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getChatRoomMembershipPath(gameId, chatRoomId, null), null, obj),
          () => this.checker.checkMembershipConsistent(membershipId));
      this.listenForPropertyChanges_(
          snap.ref, MEMBERSHIP_PROPERTIES, MEMBERSHIP_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getChatRoomMembershipPath(gameId, chatRoomId, membershipId).concat([property]), value),
                () => this.checker.checkMembershipConsistent(membershipId));
          });
    });
  }

  listenToChatRoomMessages_(gameId, chatRoomId) {
    var ref = this.firebaseRoot.child("/chatRooms/" + chatRoomId + "/messages");
    ref.on("child_added", (snap) => {
      let messageId = snap.getKey();
      let obj = newMessage(messageId, snap.val());
      let insertIndex =
          Utils.findInsertIndex(
              this.nearReader.get(this.nearReader.getChatRoomMessagePath(gameId, chatRoomId, null)),
              obj.index);
      this.gatedWrite(
          () => {
            this.writer.insert(
                this.nearReader.getChatRoomMessagePath(gameId, chatRoomId),
                insertIndex,
                obj)
          },
          () => this.checker.checkMessageConsistent(messageId));
      this.listenForPropertyChanges_(
          snap.ref, MESSAGE_PROPERTIES, MESSAGE_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getChatRoomMessagePath(gameId, chatRoomId, messageId).concat([property]), value),
                () => this.checker.checkMessageConsistent(messageId));
          });
    });
  }

  listenToPlayers_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players");
    ref.on("child_added", (gamePlayerSnap) => {
      let playerId = gamePlayerSnap.getKey();
      let obj = newPlayer(playerId, gamePlayerSnap.val());
      let userId = obj.userId;
      if (this.userId == userId) {
        this.firebaseRoot.child("users/" + userId + "/players/" + playerId).once("value")
            .then((userPlayerSnap) => {
              this.gatedWrite(
                  () => this.writer.insert(this.nearReader.getPlayerPath(gameId, null), null, obj),
                  () => this.checker.checkPlayerConsistent(playerId));
              this.listenForPropertyChanges_(
                  gamePlayerSnap.ref, PLAYER_PROPERTIES, PLAYER_COLLECTIONS,
                  (property, value) => {
                    this.gatedWrite(
                        () => this.writer.set(this.nearReader.getPlayerPath(gameId, playerId).concat([property]), value),
                        () => this.checker.checkPlayerConsistent(playerId));
                  });
              this.listenForPropertyChanges_(
                  userPlayerSnap.ref,
                  USER_PLAYER_PROPERTIES, USER_PLAYER_COLLECTIONS,
                  (property, value) => {
                    this.gatedWrite(
                        () => this.writer.set(this.nearReader.getPlayerPath(gameId, playerId).concat([property]), value),
                        () => this.checker.checkPlayerConsistent(playerId));
                  });
              this.listenToClaims_(gameId, playerId);
              this.listenToLives_(userId, playerId, gameId);
              this.listenToInfections_(gameId, playerId);
              this.listenToNotifications_(userId, playerId, gameId);
            });
      } else {
        this.gatedWrite(
            () => this.writer.insert(this.nearReader.getPlayerPath(gameId, null), null, obj),
            () => this.checker.checkPlayerConsistent(playerId));
        this.listenForPropertyChanges_(
            gamePlayerSnap.ref, PLAYER_PROPERTIES, PLAYER_COLLECTIONS,
            (property, value) => {
              this.gatedWrite(
                  () => this.writer.set(this.nearReader.getPlayerPath(gameId, playerId).concat([property]), value),
                  () => this.checker.checkPlayerConsistent(playerId));
            });
        this.listenToClaims_(gameId, playerId);
        this.listenToInfections_(gameId, playerId);
      }
    });
  }

  listenToClaims_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/claims");
    ref.on("child_added", (snap) => {
      let claimId = snap.getKey();
      let obj = newClaim(claimId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getClaimPath(gameId, playerId, null), null, obj),
          () => this.checker.checkClaimConsistent(claimId));
      this.listenForPropertyChanges_(
          snap.ref, CLAIM_PROPERTIES, CLAIM_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getClaimPath(gameId, playerId, claimId).concat([property]), value),
                () => this.checker.checkClaimConsistent(claimId));
          });
    });
  }

  listenToLives_(userId, playerId, gameId) {
    var ref = this.firebaseRoot.child("users/" + userId + "/players/" + playerId + "/lives");
    ref.on("child_added", (snap) => {
      let lifeId = snap.getKey();
      let obj = newLife(lifeId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getLifePath(gameId, playerId, null), null, obj),
          () => this.checker.checkLifeConsistent(lifeId));
      this.listenForPropertyChanges_(
          snap.ref, LIFE_PROPERTIES, LIFE_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getLifePath(gameId, playerId, lifeId).concat([property]), value),
                () => this.checker.checkLifeConsistent(lifeId));
          });
    });
  }

  listenToInfections_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/infections");
    ref.on("child_added", (snap) => {
      let infectionId = snap.getKey();
      let obj = newInfection(infectionId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getInfectionPath(gameId, playerId, null), null, obj),
          () => this.checker.checkInfectionConsistent(infectionId));
      this.listenForPropertyChanges_(
          snap.ref, INFECTION_PROPERTIES, INFECTION_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getInfectionPath(gameId, playerId, infectionId).concat([property]), value),
                () => this.checker.checkInfectionConsistent(infectionId));
          });
    });
  }

  listenToNotifications_(userId, playerId, gameId) {
    var ref = this.firebaseRoot.child("users/" + userId + "/players/" + playerId + "/notifications");
    ref.on("child_added", (snap) => {
      let notificationId = snap.getKey();
      let obj = newNotification(notificationId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getNotificationPath(gameId, playerId, null), null, obj),
          () => this.checker.checkNotificationConsistent(notificationId));
      this.listenForPropertyChanges_(
          snap.ref, NOTIFICATION_PROPERTIES, NOTIFICATION_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getNotificationPath(gameId, playerId, notificationId).concat([property]), value),
                () => this.checker.checkNotificationConsistent(notificationId));
          });
    });
  }

  listenToRewardCategories_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/rewardCategories");
    ref.on("child_added", (snap) => {
      let rewardCategoryId = snap.getKey();
      let obj = newRewardCategory(rewardCategoryId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getRewardCategoryPath(gameId, null), null, obj),
          () => this.checker.checkRewardCategoryConsistent(rewardCategoryId));
      this.listenForPropertyChanges_(
          snap.ref, REWARD_CATEGORY_PROPERTIES, REWARD_CATEGORY_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getRewardCategoryPath(gameId, rewardCategoryId).concat([property]), value),
                () => this.checker.checkRewardCategoryConsistent(rewardCategoryId));
          });
      this.listenToRewards_(gameId, rewardCategoryId);
    });
  }

  listenToRewards_(gameId, rewardCategoryId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/rewardCategories/" + rewardCategoryId + "/rewards");
    ref.on("child_added", (snap) => {
      let rewardId = snap.getKey();
      let obj = newReward(rewardId, snap.val());
      this.gatedWrite(
          () => this.writer.insert(this.nearReader.getRewardPath(gameId, rewardCategoryId, null), null, obj),
          () => this.checker.checkRewardConsistent(rewardId));
      this.listenForPropertyChanges_(
          snap.ref, REWARD_PROPERTIES, REWARD_COLLECTIONS,
          (property, value) => {
            this.gatedWrite(
                () => this.writer.set(this.nearReader.getRewardPath(gameId, rewardCategoryId, rewardId).concat([property]), value),
                () => this.checker.checkRewardConsistent(rewardId));
          });
    });
  }
}
