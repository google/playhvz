'use strict';

// This class's job is to listen to firebase, and send batches of updates
// to the given destinationBatchedWriter, such that its result will:
// - Have corresponding id-to-object maps as well as arrays. For example,
//   game has a missions array, and also a missionsById map.
// - Always be consistent; no dangling IDs.
// That last one means that we have to batch writes into transaction-ish
// groups; the whole story is consistent before and after these batches.
// Because of that, destinationBatchedWriter needs to be a BatchedWriter.
class FirebaseListener {
  constructor(destinationBatchedWriter, firebaseRoot) {
    // This is a plain object, which will have all of our games, guns, users,
    // and everything below them.
    let privateDatabaseCopyObject = {};

    // We can read it with this...
    this.reader =
        // ...which is a PathFindingReader, something that has specific
        // knowledge of our model, and has methods like
        // getLifePath(gameId, playerId, lifeId) which are super convenient.
        new PathFindingReader(
            // The PathFindingReader isn't given a plain object, it's given a
            // reader, which has a get(path) method.
            new SimpleReader(
                // The simple reader will read from our plain object.
                privateDatabaseCopyObject));

    // Just makes one and returns it, but also saves it so we can later flip on the consistency checking
    let makeConsistentWriter = (destination) => {
      this.consistentWriter = new ConsistentWriter(destination);//, false); // false means its not consistency checking yet
      return this.consistentWriter;
    };

    // Whenever we want to change the database, we write to this writer.
    // (a writer is just something that has set/push/remove methods).
    this.writer =
        // When we write, the TeeWriter takes that write and sends it to
        // two places. We want it to eventually go into our privateDatabaseCopyObject,
        // which we can read, and also the destinationBatchedWriter.
        new TeeWriter(
            // The first place we want to write to will eventually go to our
            // privateDatabaseCopyObject. But we need to do some operations on
            // any changes going there. First thing we need to do is maintain
            // the mappings (playersById, usersById, etc)
            new MappingWriter(
                // The MappingWriter will send its writes to this SimpleWriter
                // which is a tiny wrapper that just takes set/insert/remove
                // operations and executes them on a plain javascript object.
                new SimpleWriter(privateDatabaseCopyObject)),
            // The second place we want to write to will eventually end up in the
            // destinationBatchedWriter, the ultimate consumer of our work here.
            // But first, lets notice that the TeeWriter just sends the same object
            // to two different places, which is very troublesome. This cloning
            // writer will make a copy of the object it's given and send that instead.
            new CloningWriter(
                // We want to maintain the maps on whatever operations we end.
                new MappingWriter(
                    // This ConsistentWriter will hold back all of its writes
                    // until the right moment, when releasing all of the writes
                    // would result in a consistent object (no dangling id references).
                    makeConsistentWriter(
                        // The ConsistentWriter expects a GatedWriter, which it can
                        // open and close as it wills (when its consistent, really).
                        // This TimedGatedWriter is a subclass of GatedWriter which
                        // is wired to give up after 2 entire seconds of inconsistency,
                        // and just release the writes anyway.
                        new TimedGatedWriter(
                            // The MappingWriter will give its writes to whatever
                            // writer the FirebaseListener was given (supposedly,
                            // a writer which writes to something that the UI pays
                            // attention to)
                            destinationBatchedWriter, true)))));
    // Set up the initial structure. Gotta have a games, users, and guns array.
    this.writer.set(this.reader.getGunPath(null), []);
    this.writer.set(this.reader.getGamePath(null), []);
    this.writer.set(this.reader.getUserPath(null), []);

    this.firebaseRoot = firebaseRoot;
  }
  listenToGamePublic(gameId) {
    this.listenToGamePublic = () => throwError("Can't call listenToGamePublic twice!");
    this.writer.set(this.reader.getGamePath(gameId).concat(["loaded"]), true);
    this.listenToQuizQuestions_(gameId);
  }
  listenToGamePrivate(gameId, currentPlayerId) {
    this.listenToGamePrivate = () => throwError("Can't call listenToGamePrivate twice!");
    assert(currentPlayerId === null || currentPlayerId);
    this.listenToPlayers_(gameId, currentPlayerId);
    this.listenToMissions_(gameId, currentPlayerId);
    this.listenToGroups_(gameId, currentPlayerId);
    this.listenToChatRooms_(gameId, currentPlayerId);
    this.listenToRewardCategories_(gameId, currentPlayerId);
    this.listenToNotificationCategories_(gameId, currentPlayerId);
  }
  listenToUser(userId) {
    return this.deepListenToUser(userId)
        .then(() => {
          this.userId = userId;
          this.shallowListenToGames();
          this.listenToGuns();
          this.listenToUser = () => throwError("Can't call listenToUser twice!");
        });
  }
  listenForPropertyChanges_(collectionRef, properties, ignored, setCallback) {
    collectionRef.on("child_added", (change) => {
      if (properties.includes(change.getKey())) {
        setCallback(change.getKey(), change.val());
      } else {
        assert(
            ignored.includes(change.getKey()),
            "Unexpected child_added!", "Child key:", change.getKey(), "Child value:", change.val(), arguments);
      }
    });
    collectionRef.on("child_changed", (change) => {
      if (properties.includes(change.getKey())) {
        setCallback(change.getKey(), change.val());
      } else {
        assert(
            ignored.includes(change.getKey()),
            "Unexpected child_changed!", "Child key:", change.getKey(), "Child value:", change.val(), arguments);
      }
    });
    collectionRef.on("child_removed", (change) => {
      if (properties.includes(change.getKey())) {
        setCallback(change.getKey(), null);
      } else {
        assert(
            ignored.includes(change.getKey()),
            "Unexpected!", change.val(), change.getKey(), arguments);
      }
    });
  }

  listenToGuns() {
    this.firebaseRoot.child("guns").on("child_added", (snap) => {
      let gunId = snap.getKey();
      let obj = newGun(gunId, snap.val());
      this.writer.insert(this.reader.getGunPath(null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, GUN_PROPERTIES, GUN_COLLECTIONS.concat(["a"]),
          (property, value) => {
            this.writer.set(this.reader.getGunPath(gunId).concat([property]), value);
          });
    });
  }

  listenToPrivatePlayers_(userId) {
    var ref = this.firebaseRoot.child("users/" + userId + "/players");
    ref.on("child_added", (snap) => {
      let playerId = snap.getKey();
      let obj = newUserPlayer(playerId, {
        playerId: playerId,
        gameId: snap.val().gameId,
        userId: userId,
      });
      this.writer.insert(this.reader.getUserPlayerPath(userId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, USER_PLAYER_PROPERTIES, USER_PLAYER_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getUserPlayerPath(userId, playerId).concat([property]), value);
          });
    });
  }

  shallowListenToGames() {
    this.firebaseRoot.child("games").on("child_added", (snap) => {
      let gameId = snap.getKey();
      let obj = newGame(gameId, snap.val());
      obj.inMemory = false;
      this.writer.insert(this.reader.getGamePath(null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, GAME_PROPERTIES, GAME_COLLECTIONS.concat(["missions", "chatRooms", "adminUsers", "notificationCategories", "groups"]),
          (property, value) => {
            this.writer.set(this.reader.getGamePath(gameId).concat([property]), value);
          });
      this.listenToAdmins_(gameId);
    });
    // this.firebaseRoot.child("games").on("child_removed", (snap) => {
    //   this.splice(this.reader.getGamePath(), this.reader.getGameIndex(snap.getKey()), 1);
    // });
  }

  deepListenToUser(userId) {
    return new Promise((resolve, reject) => {
      let ref = this.firebaseRoot.child("users/" + userId);
      ref.once("value").then((snap) => {
        if (snap.val() == null) {
          console.log('value is null?', snap.val());
          reject();
          return;
        }
        resolve();
        let obj = newUser(userId, snap.val());
        this.writer.insert(this.reader.getUserPath(null), null, obj);
        this.listenForPropertyChanges_(
            ref, USER_PROPERTIES, USER_COLLECTIONS.concat(["playerIdsByGameId", "gameIdsByPlayerId", "a", "name"]),
            (property, value) => {
              this.writer.set(this.reader.getUserPath(userId).concat([property]), value);
            });
        this.listenToPrivatePlayers_(userId);
      });
    });
  }

  listenToAdmins_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/adminUsers");
    ref.on("child_added", (snap) => {
      let userId = snap.getKey();
      let obj = newAdmin(userId, {userId: userId});
      this.writer.insert(this.reader.getAdminPath(gameId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, ADMIN_PROPERTIES, ADMIN_COLLECTIONS.concat(["a"]),
          (property, value) => {
            this.writer.set(this.reader.getAdminPath(gameId, userId).concat([property]), value);
          });
    });
  }

  listenToQuizQuestions_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/quizQuestions");
    ref.on("child_added", (snap) => {
      let quizQuestionId = snap.getKey();
      let obj = newQuizQuestion(quizQuestionId, snap.val());
      this.writer.insert(this.reader.getQuizQuestionPath(gameId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, QUIZ_QUESTION_PROPERTIES, QUIZ_QUESTION_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getQuizQuestionPath(gameId, quizQuestionId).concat([property]), value);
          });
      this.listenToQuizAnswers_(gameId, quizQuestionId);
    });
  }

  listenToQuizAnswers_(gameId, quizQuestionId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/quizQuestions/" + quizQuestionId + "/answers");
    ref.on("child_added", (snap) => {
      let quizAnswerId = snap.getKey();
      let obj = newQuizAnswer(quizAnswerId, snap.val());
      this.writer.insert(this.reader.getQuizAnswerPath(gameId, quizQuestionId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, QUIZ_ANSWER_PROPERTIES, QUIZ_ANSWER_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getQuizAnswerPath(gameId, quizQuestionId, quizAnswerId).concat([property]), value);
          });
    });
  }

  listenToMissions_(gameId, currentPlayerId) {
    let collectionRef =
        currentPlayerId ?
            this.firebaseRoot.child("players/" + currentPlayerId + "/missions") :
            this.firebaseRoot.child("games/" + gameId + "/missions");
    collectionRef.on("child_added", (snap) => {
      let missionId = snap.getKey(); // snap.val() is ""
      let ref = this.firebaseRoot.child("missions/" + missionId);
      ref.once("value").then((snap) => {
        let obj = newMission(missionId, snap.val());
        this.writer.insert(this.reader.getMissionPath(gameId, null), null, obj);
        this.listenForPropertyChanges_(
            snap.ref, MISSION_PROPERTIES, MISSION_COLLECTIONS,
            (property, value) => {
              this.writer.set(this.reader.getMissionPath(gameId, missionId).concat([property]), value);
            });
      });
    });
  }

  listenToGroups_(gameId, currentPlayerId) {
    let collectionRef =
        currentPlayerId ?
            this.firebaseRoot.child("players/" + currentPlayerId + "/groups") :
            this.firebaseRoot.child("games/" + gameId + "/groups");
    collectionRef.on("child_added", (snap) => {
      let groupId = snap.getKey(); // snap.val() is ""
      let ref = this.firebaseRoot.child("groups/" + groupId);
      ref.once("value")
          .then((snap) => {
            let obj = newGroup(groupId, snap.val());
            this.writer.insert(this.reader.getGroupPath(gameId, null), null, obj);
            this.listenForPropertyChanges_(
                snap.ref, GROUP_PROPERTIES, GROUP_COLLECTIONS.concat(["players"]),
                (property, value) => {
                  this.writer.set(this.reader.getGroupPath(gameId, groupId).concat([property]), value);
                });
            this.listenToGroupMemberships_(gameId, groupId);
          });
    });
  }

  listenToChatRooms_(gameId, currentPlayerId) {
    let collectionRef =
        currentPlayerId ?
            this.firebaseRoot.child("players/" + currentPlayerId + "/chatRooms") :
            this.firebaseRoot.child("games/" + gameId + "/chatRooms");
    collectionRef.on("child_added", (snap) => {
      let chatRoomId = snap.getKey(); // snap.val() is ""
      let ref = this.firebaseRoot.child("chatRooms/" + chatRoomId);
      ref.once("value")
          .then((snap) => {
            let obj = newChatRoom(chatRoomId, snap.val());
            this.writer.insert(this.reader.getChatRoomPath(gameId, null), null, obj);
            this.listenForPropertyChanges_(
                snap.ref, CHAT_ROOM_PROPERTIES, CHAT_ROOM_COLLECTIONS,
                (property, value) => {
                  this.writer.set(this.reader.getChatRoomPath(gameId, chatRoomId).concat([property]), value);
                });
            this.listenToChatRoomMessages_(gameId, chatRoomId);
          });
    });
  }

  listenToNotificationCategories_(gameId, currentPlayerId) {
    let collectionRef =
        currentPlayerId ?
            this.firebaseRoot.child("players/" + currentPlayerId + "/notificationCategories") :
            this.firebaseRoot.child("games/" + gameId + "/notificationCategories");
    collectionRef.on("child_added", (snap) => {
      let notificationCategoryId = snap.getKey(); // snap.val() is ""
      let ref = this.firebaseRoot.child("notificationCategories/" + notificationCategoryId);
      ref.once("value")
          .then((snap) => {
            let obj = newNotificationCategory(notificationCategoryId, snap.val());
            this.writer.insert(this.reader.getNotificationCategoryPath(gameId, null), null, obj);
            this.listenForPropertyChanges_(
                snap.ref, CHAT_ROOM_PROPERTIES, CHAT_ROOM_COLLECTIONS,
                (property, value) => {
                  this.writer.set(this.reader.getNotificationCategoryPath(gameId, notificationCategoryId).concat([property]), value);
                });
          });
    });
  }

  listenToGroupMemberships_(gameId, groupId) {
    var ref = this.firebaseRoot.child("/groups/" + groupId + "/players");
    ref.on("child_added", (snap) => {
      let playerId = snap.getKey();
      let obj = newGroupMembership(playerId, {playerId: playerId});
      this.writer.insert(this.reader.getGroupMembershipPath(gameId, groupId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, GROUP_MEMBERSHIP_PROPERTIES, GROUP_MEMBERSHIP_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getGroupMembershipPath(gameId, groupId, membershipId).concat([property]), value);
          });
    });
    ref.on("child_removed", (snap) => {
    });
  }

  listenToChatRoomMessages_(gameId, chatRoomId) {
    var ref = this.firebaseRoot.child("/chatRooms/" + chatRoomId + "/messages");
    ref.on("child_added", (snap) => {
      let messageId = snap.getKey();
      let obj = newMessage(messageId, snap.val());
      let insertIndex =
          Utils.findInsertIndex(
              this.reader.get(this.reader.getChatRoomMessagePath(gameId, chatRoomId, null)),
              obj.index);
      this.writer.insert(
          this.reader.getChatRoomMessagePath(gameId, chatRoomId),
          insertIndex,
          obj)
      this.listenForPropertyChanges_(
          snap.ref, MESSAGE_PROPERTIES, MESSAGE_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getChatRoomMessagePath(gameId, chatRoomId, messageId).concat([property]), value);
          });
    });
  }

  listenToPlayers_(gameId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players");
    ref.on("child_added", (gamePlayerSnap) => {
      let playerId = gamePlayerSnap.getKey();
      let obj = newPlayer(playerId, gamePlayerSnap.val());
      let userId = obj.userId;
      assert(this.userId != null);
      if (this.userId == userId) {
        this.firebaseRoot.child("/players/" + playerId).once("value")
            .then((privatePlayerSnap) => {
              obj = Utils.merge(obj, privatePlayerSnap.val());
              this.writer.insert(this.reader.getPlayerPath(gameId, null), null, obj);
              this.listenForPropertyChanges_(
                  gamePlayerSnap.ref, PLAYER_PROPERTIES, PLAYER_COLLECTIONS.concat(["canInfect"]),
                  (property, value) => {
                    this.writer.set(this.reader.getPlayerPath(gameId, playerId).concat([property]), value);
                  });
              this.listenForPropertyChanges_(
                  privatePlayerSnap.ref,
                  PRIVATE_PLAYER_PROPERTIES, PRIVATE_PLAYER_COLLECTIONS.concat(["notificationSettings", "volunteer"]),
                  (property, value) => {
                    this.writer.set(this.reader.getPlayerPath(gameId, playerId).concat([property]), value);
                  });
              this.listenForPropertyChanges_(
                  privatePlayerSnap.ref.child("volunteer"),
                  PRIVATE_PLAYER_VOLUNTEER_PROPERTIES, [],
                  (property, value) => {
                    this.writer.set(this.reader.getPlayerPath(gameId, playerId).concat(["volunteer", property]), value);
                  });
              this.listenForPropertyChanges_(
                  privatePlayerSnap.ref.child("notificationSettings"),
                  PRIVATE_PLAYER_NOTIFICATION_SETTINGS_PROPERTIES, [],
                  (property, value) => {
                    this.writer.set(this.reader.getPlayerPath(gameId, playerId).concat(["notificationSettings", property]), value);
                  });
              this.listenToClaims_(gameId, playerId);
              this.listenToLives_(playerId, gameId);
              this.listenToInfections_(gameId, playerId);
              this.listenToNotifications_(playerId, gameId);
              // this.listenToPlayerChatRoomMemberships_(gameId, playerId);
            });
      } else {
        this.writer.insert(this.reader.getPlayerPath(gameId, null), null, obj);
        this.listenForPropertyChanges_(
            gamePlayerSnap.ref, PLAYER_PROPERTIES, PLAYER_COLLECTIONS.concat(["canInfect"]),
            (property, value) => {
              this.writer.set(this.reader.getPlayerPath(gameId, playerId).concat([property]), value);
            });
        this.listenToClaims_(gameId, playerId);
        this.listenToInfections_(gameId, playerId);
      }
    });
  }

  // listenToPlayerChatRoomMemberships_(gameId, playerId) {
  //   var ref = this.firebaseRoot.child("/players/" + playerId + "/chatRoomMembershipsByChatRoomId");
  //   ref.on("child_added", (snap) => {
  //     let chatRoomId = snap.getKey();
  //     let obj = newPlayerChatRoomMembership(chatRoomId, {chatRoomId: chatRoomId});
  //     this.writer.insert(this.reader.getPlayerChatRoomMembershipPath(gameId, playerId, null), null, obj);
  //     this.listenForPropertyChanges_(
  //         snap.ref, PLAYER_CHAT_ROOM_MEMBERSHIP_PROPERTIES, PLAYER_CHAT_ROOM_MEMBERSHIP_COLLECTIONS,
  //         (property, value) => {
  //           this.writer.set(this.reader.getPlayerChatRoomMembershipPath(gameId, playerId, chatRoomId).concat([property]), value);
  //         });
  //   });
  //   ref.on("child_removed", (snap) => {
  //     let chatRoomId = snap.getKey();
  //     let path = this.reader.getPlayerChatRoomMembershipPath(gameId, playerId, chatRoomId);
  //     this.writer.remove(
  //         path.slice(0, path.length - 1),
  //         path.slice(-1)[0],
  //         chatRoomId);
  //   });
  // }

  listenToClaims_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/claims");
    ref.on("child_added", (snap) => {
      let claimId = snap.getKey();
      let obj = newClaim(claimId, snap.val());
      this.writer.insert(this.reader.getClaimPath(gameId, playerId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, CLAIM_PROPERTIES, CLAIM_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getClaimPath(gameId, playerId, claimId).concat([property]), value);
          });
    });
  }

  listenToLives_(playerId, gameId) {
    var ref = this.firebaseRoot.child("players/" + playerId + "/lives");
    ref.on("child_added", (snap) => {
      let lifeId = snap.getKey();
      let obj = newLife(lifeId, snap.val());
      this.writer.insert(this.reader.getLifePath(gameId, playerId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, LIFE_PROPERTIES, LIFE_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getLifePath(gameId, playerId, lifeId).concat([property]), value);
          });
    });
  }

  listenToInfections_(gameId, playerId) {
    var ref = this.firebaseRoot.child("games/" + gameId + "/players/" + playerId + "/infections");
    ref.on("child_added", (snap) => {
      let infectionId = snap.getKey();
      let obj = newInfection(infectionId, snap.val());
      this.writer.insert(this.reader.getInfectionPath(gameId, playerId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, INFECTION_PROPERTIES, INFECTION_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getInfectionPath(gameId, playerId, infectionId).concat([property]), value);
          });
    });
  }

  listenToNotifications_(playerId, gameId) {
    var ref = this.firebaseRoot.child("/players/" + playerId + "/notifications");
    ref.on("child_added", (snap) => {
      let notificationCategoryId = snap.getKey();
      snap.ref.on("child_added", (snap) => {
        let notificationId = snap.getKey();
        let obj = newNotification(notificationId, snap.val());
        obj.notificationCategoryId = notificationCategoryId;
        this.writer.insert(this.reader.getNotificationPath(gameId, playerId, null), null, obj);
        this.listenForPropertyChanges_(
            snap.ref, NOTIFICATION_PROPERTIES, NOTIFICATION_COLLECTIONS,
            (property, value) => {
              this.writer.set(this.reader.getNotificationPath(gameId, playerId, notificationId).concat([property]), value);
            });
      });
    });
  }

  listenToRewardCategories_(gameId) {
    var collectionRef = this.firebaseRoot.child("games/" + gameId + "/rewardCategories");
    collectionRef.on("child_added", (snap) => {
      let rewardCategoryId = snap.getKey(); // snap.val() is ""
      let ref = this.firebaseRoot.child("rewardCategories/" + rewardCategoryId);
      ref.once("value")
          .then((snap) => {
            let obj = newRewardCategory(rewardCategoryId, snap.val());

            this.writer.insert(this.reader.getRewardCategoryPath(gameId, null), null, obj);
            this.listenForPropertyChanges_(
                snap.ref, REWARD_CATEGORY_PROPERTIES, REWARD_CATEGORY_COLLECTIONS,
                (property, value) => {
                  this.writer.set(this.reader.getRewardCategoryPath(gameId, rewardCategoryId).concat([property]), value);
                });
            this.listenToRewards_(gameId, rewardCategoryId);
          });
    });
  }

  listenToRewards_(rewardCategoryId) {
    var collectionRef = this.firebaseRoot.child("rewardCategories/" + rewardCategoryId + "/rewards");
    collectionRef.on("child_added", (snap) => {
      let rewardId = snap.getKey(); // snap.val() is ""
      let ref = this.firebaseRoot.child("rewards/" + rewardId);
      ref.once("value")
          .then((snap) => {
            let obj = newReward(rewardId, snap.val());
            this.writer.insert(this.reader.getRewardPath(gameId, rewardCategoryId, null), null, obj);
            this.listenForPropertyChanges_(
                snap.ref, REWARD_PROPERTIES, REWARD_COLLECTIONS,
                (property, value) => {
                  this.writer.set(this.reader.getRewardPath(gameId, rewardCategoryId, rewardId).concat([property]), value);
                });
          });
    });
  }
}

