'use strict';

window.FirebaseListener = (function() {

const GUN_PROPERTIES = ["gameId", "playerId", "label"];
const GUN_COLLECTIONS = [];
const USER_PROPERTIES = ["a"];
const USER_COLLECTIONS = ["players"];
const PRIVATE_PLAYER_PROPERTIES = ["gameId", "userId", "canInfect", "needGun", "startAsZombie", "wantToBeSecretZombie", "gotEquipment", "notes"];
const PRIVATE_PLAYER_NOTIFICATION_SETTINGS_PROPERTIES = ["sound", "vibrate"];
const PRIVATE_PLAYER_VOLUNTEER_PROPERTIES = ["advertising", "logistics", "communications", "moderator", "cleric", "sorcerer", "admin", "photographer", "chronicler", "android", "ios", "server", "client"];
const PRIVATE_PLAYER_COLLECTIONS = ["lives", "chatRooms", "missions"];
const USER_PLAYER_PROPERTIES = ["gameId", "userId"];
const USER_PLAYER_COLLECTIONS = [];
const GAME_PROPERTIES = ["active", "started", "name", "number", "rulesHtml", "faqHtml", "stunTimer", "adminContactPlayerId"];
const GAME_COLLECTIONS = ["missions", "rewardCategories", "chatRooms", "players", "admins", "notificationCategories", "quizQuestions", "groups"];
const QUIZ_QUESTION_PROPERTIES = ["text", "type"];
const QUIZ_QUESTION_COLLECTIONS = ["answers"];
const QUIZ_ANSWER_PROPERTIES = ["text", "isCorrect", "order"];
const QUIZ_ANSWER_COLLECTIONS = [];
const GROUP_PROPERTIES = ["name", "gameId", "allegianceFilter", "autoAdd", "membersCanAdd", "membersCanRemove", "autoRemove", "ownerPlayerId"];
const GROUP_COLLECTIONS = ["players"];
const CHAT_ROOM_PROPERTIES = ["gameId", "name", "groupId", "withAdmins"];
const CHAT_ROOM_COLLECTIONS = ["messages", "acks"];
const GROUP_MEMBERSHIP_PROPERTIES = ["playerId"];
const GROUP_MEMBERSHIP_COLLECTIONS = [];
const PLAYER_CHAT_ROOM_MEMBERSHIP_PROPERTIES = ["chatRoomId"];
const PLAYER_CHAT_ROOM_MEMBERSHIP_COLLECTIONS = [];
const PLAYER_MISSION_MEMBERSHIP_PROPERTIES = ["missionId"];
const PLAYER_MISSION_MEMBERSHIP_COLLECTIONS = [];
const PLAYER_GROUP_MEMBERSHIP_PROPERTIES = ["groupId"];
const PLAYER_GROUP_MEMBERSHIP_COLLECTIONS = [];
const MESSAGE_PROPERTIES = ["index", "message", "playerId", "time"];
const MESSAGE_COLLECTIONS = [];
const MISSION_PROPERTIES = ["gameId", "name", "begin", "end", "detailsHtml", "groupId"];
const MISSION_COLLECTIONS = [];
const ADMIN_PROPERTIES = ["userId"];
const ADMIN_COLLECTIONS = [];
const NOTIFICATION_CATEGORY_PROPERTIES = ["gameId", "name", "message", "previewMessage", "sendTime", "allegianceFilter", "email", "app", "sound", "vibrate", "destination", "icon"];
const NOTIFICATION_CATEGORY_COLLECTIONS = [];
const PLAYER_PROPERTIES = ["active", "userId", "number", "allegiance", "name", "points", "profileImageUrl"];
const PLAYER_COLLECTIONS = ["infections", "lives", "claims", "notifications", "chatRooms", "groupMemberships"];
const CLAIM_PROPERTIES = ["time", "rewardId", "rewardCategoryId"];
const CLAIM_COLLECTIONS = [];
const PUBLIC_LIFE_PROPERTIES = ["time"];
const PUBLIC_LIFE_COLLECTIONS = [];
const PRIVATE_LIFE_PROPERTIES = ["code"];
const PRIVATE_LIFE_COLLECTIONS = [];
const INFECTION_PROPERTIES = ["time", "infectorId"];
const INFECTION_COLLECTIONS = [];
const NOTIFICATION_PROPERTIES = ["message", "previewMessage", "notificationCategoryId", "seenTime", "sound", "vibrate", "app", "email", "destination"];
const NOTIFICATION_COLLECTIONS = [];
const REWARD_CATEGORY_PROPERTIES = ["name", "shortName", "points", "seed", "claimed", "gameId", "limitPerPlayer"];
const REWARD_CATEGORY_COLLECTIONS = ["rewards"];
const REWARD_PROPERTIES = ["playerId", "code"];
const REWARD_COLLECTIONS = [];

// This class's job is to listen to firebase, and send batches of updates
// to the given destinationBatchedWriter, such that its result will:
// - Have corresponding id-to-object maps as well as arrays. For example,
//   game has a missions array, and also a missionsById map.
// - Always be consistent; no dangling IDs.
// That last one means that we have to batch writes into transaction-ish
// groups; the whole story is consistent before and after these batches.
// Because of that, destinationBatchedWriter needs to be a BatchedWriter.
class FirebaseListener {
  constructor(firebaseRoot) {
    this.destination = new TeeWriter();

    // This is a plain object, which will have all of our games, guns, users,
    // and everything below them.
    let privateDatabaseCopyObject = {};

    this.listenedToPaths = {};

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
        new BatchingWriter(
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
                                this.destination, true))))));
    this.firebaseRoot = firebaseRoot;
  }
  listenToDatabase(destination) {
    this.destination.addDestination(destination);
    // Set up the initial structure. Gotta have a games, users, and guns array.
    this.writer.set(this.reader.getGunPath(null), []);
    this.writer.set(this.reader.getGamePath(null), []);
    this.writer.set(this.reader.getUserPath(null), []);
    assert(this.reader.source.source.games);

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

  listenOnce_(path) {
    if (this.listenedToPaths[path]) {
      // Never resolves
      return new Promise((resolve, reject) => {});
    }
    this.listenedToPaths[path] = true;
    return this.firebaseRoot.child(path).once("value");
  }

  unlisten_(path) {
    delete this.listenedToPaths[path];
  }

  // deepListenToUser(userId) {
  //   return new Promise((resolve, reject) => {
  //     let ref = this.firebaseRoot.child("users/" + userId);
  //     ref.once("value").then((snap) => {
  //       if (snap.val() == null) {
  //         console.log('value is null?', snap.val());
  //         reject();
  //         return;
  //       }
  //       resolve();
  //       let obj = new Model.User(userId, snap.val());
  //       this.writer.insert(this.reader.getUserPath(null), null, obj);
  //       this.listenForPropertyChanges_(
  //           ref, USER_PROPERTIES, USER_COLLECTIONS.concat(["playerIdsByGameId", "gameIdsByPlayerId", "a", "name"]),
  //           (property, value) => {
  //             this.writer.set(this.reader.getUserPath(userId).concat([property]), value);
  //           });
  //       this.listenToUserPlayers_(userId);
  //     });
  //   });
  // }

  listenToUser(userId) {
    return this.listenOnce_(`/users/${userId}`)
        .then((snap) => {
          if (snap.val() == null) {
            console.log('value is null?', snap.val());
            this.unlisten_(`/users/${userId}`);
            return null;
          }
          let obj = new Model.User(userId, snap.val());
          this.userId = userId;
          this.writer.insert(this.reader.getUserPath(null), null, obj);
          this.listenForPropertyChanges_(
              snap.ref, USER_PROPERTIES, USER_COLLECTIONS.concat(["players", "name"]),
              (property, value) => {
                this.writer.set(this.reader.getUserPath(userId).concat([property]), value);
              });
          this.firebaseRoot.child(`users/${userId}/players`)
              .on("child_added", (snap) => this.listenToUserPlayer_(userId, snap.getKey()));
          this.firebaseRoot.child(`guns`)
              .on("child_added", (snap) => this.listenToGun_(snap.getKey()));
          this.firebaseRoot.child(`games`)
              .on("child_added", (snap) => this.listenToGameShallow_(snap.getKey()));
          return userId;
        })
        .catch((e) => {
          // debugger;
          // if (e.something != what) {
            throw e;
          // }
          // return e;
        });
  }
  listenToUserPlayer_(userId, playerId) {
    this.listenOnce_(`users/${userId}/players/${playerId}`).then((snap) => {
      let obj = new Model.UserPlayer(playerId, {
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
  listenToGun_(gunId) {
    this.listenOnce_(`guns/${gunId}`).then((snap) => {
      let gunId = snap.getKey();
      let obj = new Model.Gun(gunId, snap.val());
      this.writer.insert(this.reader.getGunPath(null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, GUN_PROPERTIES, GUN_COLLECTIONS.concat(["a"]),
          (property, value) => {
            this.writer.set(this.reader.getGunPath(gunId).concat([property]), value);
          });
    });
  }
  listenToGameShallow_(gameId) {
    this.listenOnce_(`games/${gameId}`).then((snap) => {
      let props = snap.val();
      props.loaded = false;
      let game = new Model.Game(gameId, props);
      this.writer.insert(this.reader.getGamePath(null), null, game);
      this.listenForPropertyChanges_(
          snap.ref, GAME_PROPERTIES, GAME_COLLECTIONS.concat(["missions", "chatRooms", "adminUsers", "notificationCategories", "groups"]),
          (property, value) => {
            this.writer.set(this.reader.getGamePath(gameId).concat([property]), value);
          });
      this.firebaseRoot.child(`games/${gameId}/adminUsers`)
          .on("child_added", (snap) => this.listenToAdmin_(gameId, snap.getKey()));
      // listen to quiz questions etc
    });
  }

  listenToAdmin_(gameId, userId) {
    this.listenOnce_(`games/${gameId}/adminUsers/${userId}`).then((snap) => {
      let obj = new Model.Admin(userId, {userId: userId});
      this.writer.insert(this.reader.getAdminPath(gameId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, ADMIN_PROPERTIES, ADMIN_COLLECTIONS.concat(["a"]),
          (property, value) => {
            this.writer.set(this.reader.getAdminPath(gameId, userId).concat([property]), value);
          });
    });
  }

  listenToGamePublic_(gameId) {
    this.writer.set(this.reader.getGamePath(gameId).concat(["loaded"]), true);
    this.firebaseRoot.child(`games/${gameId}/quizQuestions`)
        .on("child_added", (snap) => this.listenToQuizQuestion_(gameId, snap.getKey()));
  }

  listenToGameAsAdmin({gameId}) {
    this.listenToGamePublic_(gameId);
    this.firebaseRoot.child(`games/${gameId}/missions`)
        .on("child_added", (snap) => this.listenToMission_(gameId, snap.getKey()));
    this.firebaseRoot.child(`games/${gameId}/players`)
        .on("child_added", (snap) => this.listenToPlayerPrivate_(gameId, snap.getKey()));
    this.firebaseRoot.child(`games/${gameId}/groups`)
        .on("child_added", (snap) => this.listenToGroup_(gameId, snap.getKey()));
    this.firebaseRoot.child(`games/${gameId}/chatRooms`)
        .on("child_added", (snap) => this.listenToChatRoom_(gameId, snap.getKey()));
    this.firebaseRoot.child(`games/${gameId}/rewardCategories`)
        .on("child_added", (snap) => this.listenToRewardCategory_(gameId, snap.getKey()));
    this.firebaseRoot.child(`games/${gameId}/notificationCategories`)
        .on("child_added", (snap) => this.listenToNotificationCategory_(gameId, snap.getKey()));
  }

  listenToGameAsNonAdmin({gameId, playerId}) {
    let currentPlayerId = playerId;
    this.listenToGamePublic_(gameId);
    this.firebaseRoot.child(`games/${gameId}/rewardCategories`)
        .on("child_added", (snap) => this.listenToRewardCategory_(gameId, snap.getKey()));
    this.firebaseRoot.child(`games/${gameId}/players`)
        .on("child_added", (snap) => {
      let playerId = snap.getKey();
      if (playerId == currentPlayerId) {
        this.listenToPlayerPrivate_(gameId, playerId);
      } else {
        this.listenToPlayerPublic_(gameId, playerId);
      }
    });

    // this.listenToGameAsNonAdmin = () => throwError("Can't call listenToGamePrivate twice!");
    // assert(currentPlayerId === null || currentPlayerId);
    // if (currentPlayerId == null) {
    //   this.listenToPlayers_(gameId, currentPlayerId);
    //   this.listenToMissions_(gameId, currentPlayerId);
    //   this.listenToGroups_(gameId, currentPlayerId);
    //   this.listenToChatRooms_(gameId, currentPlayerId);
    //   this.listenToRewardCategories_(gameId, currentPlayerId);
    //   this.listenToNotificationCategories_(gameId, currentPlayerId);
    // }
  }

  listenToPlayerPrivate_(gameId, playerId) {
    Promise.all([
        this.listenOnce_(`/playersPublic/${playerId}`),
        this.listenOnce_(`/playersPrivate/${playerId}`)])
        .then(([publicSnap, privateSnap]) => {
      let properties = Utils.merge(publicSnap.val(), privateSnap.val());
      this.loadPlayer_(gameId, playerId, properties);
      this.listenForPropertyChanges_(
          publicSnap.ref, PLAYER_PROPERTIES, PLAYER_COLLECTIONS.concat(["canInfect"]),
          (property, value) => {
            this.writer.set(this.reader.getPlayerPath(gameId, playerId).concat([property]), value);
          });
      this.listenForPropertyChanges_(
          privateSnap.ref,
          PRIVATE_PLAYER_PROPERTIES, PRIVATE_PLAYER_COLLECTIONS.concat(["notificationSettings", "volunteer"]),
          (property, value) => {
            this.writer.set(this.reader.getPlayerPath(gameId, playerId).concat([property]), value);
          });
      this.listenForPropertyChanges_(
          privateSnap.ref.child(`volunteer`),
          PRIVATE_PLAYER_VOLUNTEER_PROPERTIES, [],
          (property, value) => {
            this.writer.set(this.reader.getPlayerPath(gameId, playerId).concat(["volunteer", property]), value);
          });
      this.listenForPropertyChanges_(
          privateSnap.ref.child(`notificationSettings`),
          PRIVATE_PLAYER_NOTIFICATION_SETTINGS_PROPERTIES, [],
          (property, value) => {
            this.writer.set(this.reader.getPlayerPath(gameId, playerId).concat(["notificationSettings", property]), value);
          });
      this.firebaseRoot.child(`/playersPublic/${playerId}/claims`)
          .on("child_added", (snap) => this.listenToClaim_(gameId, playerId, snap.getKey()));
      this.firebaseRoot.child(`/playersPublic/${playerId}/infections`)
          .on("child_added", (snap) => this.listenToInfection_(gameId, playerId, snap.getKey()));
      this.firebaseRoot.child(`/playersPublic/${playerId}/lives`)
          .on("child_added", (snap) => this.listenToLifePrivate_(gameId, playerId, snap.getKey()));
      this.firebaseRoot.child(`/playersPrivate/${playerId}/notifications`)
          .on("child_added", (snap) => {
        let notificationId = snap.getKey();
        let notificationCategoryId = snap.getKey();
        this.listenToNotification_(gameId, playerId, notificationId);
        this.listenToNotificationCategory_(gameId, notificationCategoryId);
      });
      this.firebaseRoot.child(`playersPrivate/${playerId}/chatRooms`)
          .on("child_added", (snap) => {
        let chatRoomId = snap.getKey();
        this.listenToPlayerChatRoomMembership_(gameId, playerId, chatRoomId);
        this.listenToChatRoom_(gameId, chatRoomId);
      });
      this.firebaseRoot.child(`playersPrivate/${playerId}/chatRooms`)
          .on("child_removed", (snap) => {
        let chatRoomId = snap.getKey();
        let path = this.reader.getPlayerChatRoomMembershipPath(gameId, playerId, chatRoomId);
        let index = path[path.length - 1];
        path = path.slice(0, path.length - 1);
        this.writer.remove(path, index, chatRoomId);
      });
      this.firebaseRoot.child(`playersPrivate/${playerId}/missions`)
          .on("child_added", (snap) => {
        let missionId = snap.getKey();
        this.listenToPlayerMissionMembership_(gameId, playerId, missionId);
        this.listenToMission_(gameId, missionId);
      });
    });
  }

  listenToPlayerPublic_(gameId, playerId) {
    this.listenOnce_(`playersPublic/${playerId}`).then((snap) => {
      this.loadPlayer_(gameId, playerId, snap.val());
      this.listenForPropertyChanges_(
          snap.ref, PLAYER_PROPERTIES, PLAYER_COLLECTIONS.concat(["canInfect"]),
          (property, value) => {
            this.writer.set(this.reader.getPlayerPath(gameId, playerId).concat([property]), value);
          });
      this.firebaseRoot.child(`/playersPublic/${playerId}/claims`)
          .on("child_added", (snap) => this.listenToClaim_(gameId, playerId, snap.getKey()));
      this.firebaseRoot.child(`/playersPublic/${playerId}/infections`)
          .on("child_added", (snap) => this.listenToInfection_(gameId, playerId, snap.getKey()));
      this.firebaseRoot.child(`/playersPublic/${playerId}/lives`)
          .on("child_added", (snap) => this.listenToLifePublic_(gameId, playerId, snap.getKey()));
      });
  }

  listenToLifePublic_(gameId, playerId, lifeId) {
    this.listenOnce_(`/playersPublic/${playerId}/lives/${lifeId}`).then((snap) => {
      this.loadLife_(gameId, playerId, lifeId, snap.val());
    });
  }

  listenToLifePrivate_(gameId, playerId, lifeId) {
    Promise.all([
        this.listenOnce_(`/playersPublic/${playerId}/lives/${lifeId}`),
        this.listenOnce_(`/playersPrivate/${playerId}/lives/${lifeId}`)])
        .then(([publicSnap, privateSnap]) => {
      let properties = Utils.merge(publicSnap.val(), privateSnap.val());
      this.loadLife_(gameId, playerId, lifeId, properties);
      this.listenForPropertyChanges_(
          publicSnap.ref, PUBLIC_LIFE_PROPERTIES, PUBLIC_LIFE_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getPlayerPath(gameId, playerId).concat([property]), value);
          });
      this.listenForPropertyChanges_(
          privateSnap.ref, PRIVATE_LIFE_PROPERTIES, PRIVATE_LIFE_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getPlayerPath(gameId, playerId).concat([property]), value);
          });
    });
  }

  loadLife_(gameId, playerId, lifeId, properties) {
    this.writer.insert(
        this.reader.getLifePath(gameId, playerId, null),
        null,
        properties);
  }

  listenToInfection_(gameId, playerId, infectionId) {
    var ref = this.firebaseRoot.child(`playersPublic/${playerId}/infections`);
    ref.on("child_added", (snap) => {
      let infectionId = snap.getKey();
      let obj = new Model.Infection(infectionId, snap.val());
      this.writer.insert(this.reader.getInfectionPath(gameId, playerId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, INFECTION_PROPERTIES, INFECTION_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getInfectionPath(gameId, playerId, infectionId).concat([property]), value);
          });
    });
  }

  listenToClaim_(gameId, playerId, claimId) {
    var ref = this.firebaseRoot.child(`playersPublic/${playerId}/claims`);
    ref.on("child_added", (snap) => {
      let claimId = snap.getKey();
      let obj = new Model.Claim(claimId, snap.val());
      this.writer.insert(this.reader.getClaimPath(gameId, playerId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, CLAIM_PROPERTIES, CLAIM_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getClaimPath(gameId, playerId, claimId).concat([property]), value);
          });
    });
  }

  listenToMission_(gameId, missionId) {
    this.listenOnce_(`/missions/${missionId}`).then((snap) => {
      let obj = new Model.Mission(missionId, snap.val());
      this.writer.insert(this.reader.getMissionPath(gameId, null), null, obj);
      this.listenToGroup_(gameId, obj.groupId);
      this.listenForPropertyChanges_(
          snap.ref, MISSION_PROPERTIES, MISSION_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getMissionPath(gameId, missionId).concat([property]), value);
          });
    });
  }

  loadPlayer_(gameId, playerId, properties) {
    if ('notificationSettings' in properties)
      assert(typeof properties.notificationSettings == "object");
    else
      properties.notificationSettings = {};

    if ('volunteer' in properties)
      assert(typeof properties.volunteer == "object");
    else
      properties.volunteer = {};

    if ('canInfect' in properties)
      assert(typeof properties.canInfect == "boolean")

    let player = new Model.Player(playerId, properties);
    this.writer.insert(this.reader.getPlayerPath(gameId, null), null, player);
  }

  listenToGroup_(gameId, groupId) {
    this.listenOnce_(`/groups/${groupId}`).then((snap) => {
      let obj = new Model.Group(groupId, snap.val());
      this.writer.insert(this.reader.getGroupPath(gameId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, GROUP_PROPERTIES, GROUP_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getGroupPath(gameId, groupId).concat([property]), value);
          });
      this.firebaseRoot.child(`/groups/${groupId}/players`)
          .on("child_added", (snap) => this.listenToGroupMembership_(gameId, groupId, snap.getKey()));
    });
  }

  listenToChatRoom_(gameId, chatRoomId) {
    this.listenOnce_(`/chatRooms/${chatRoomId}`).then((snap) => {
      let obj = new Model.ChatRoom(chatRoomId, snap.val());
      this.listenToGroup_(gameId, obj.groupId);
      this.writer.insert(this.reader.getChatRoomPath(gameId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, CHAT_ROOM_PROPERTIES, CHAT_ROOM_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getChatRoomPath(gameId, chatRoomId).concat([property]), value);
          });
      this.firebaseRoot.child(`/chatRooms/${chatRoomId}/messages`)
          .on("child_added", (snap) => this.listenToChatRoomMessage_(gameId, chatRoomId, snap.getKey()));
    });
  }

  listenToChatRoomMessage_(gameId, chatRoomId, messageId) {
    this.listenOnce_(`/chatRooms/${chatRoomId}/messages/${messageId}`).then((snap) => {
      let obj = new Model.Message(messageId, snap.val());
      let existingMessages = this.reader.get(this.reader.getChatRoomMessagePath(gameId, chatRoomId, null));
      let insertIndex =
          existingMessages.findIndex((existing) => existing.time > obj.time);
      if (insertIndex < 0)
        insertIndex = existingMessages.length;
      this.writer.insert(
          this.reader.getChatRoomMessagePath(gameId, chatRoomId, null),
          insertIndex,
          obj)
      this.listenForPropertyChanges_(
          snap.ref, MESSAGE_PROPERTIES, MESSAGE_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getChatRoomMessagePath(gameId, chatRoomId, messageId).concat([property]), value);
          });
    });
  }

  listenToPlayerChatRoomMembership_(gameId, playerId, chatRoomId) {
    this.listenOnce_(`/players/${playerId}/chatRooms/${chatRoomId}`).then((snap) => {
      let obj = new Model.PlayerChatRoomMembership(chatRoomId, {chatRoomId: chatRoomId});
      this.writer.insert(this.reader.getPlayerChatRoomMembershipPath(gameId, playerId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, PLAYER_CHAT_ROOM_MEMBERSHIP_PROPERTIES, PLAYER_CHAT_ROOM_MEMBERSHIP_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getPlayerChatRoomMembershipPath(gameId, playerId, chatRoomId).concat([property]), value);
          });
    });
    // ref.on("child_removed", (snap) => {
    //   let chatRoomId = snap.getKey();
    //   let path = this.reader.getPlayerChatRoomMembershipPath(gameId, playerId, chatRoomId);
    //   this.writer.remove(
    //       path.slice(0, path.length - 1),
    //       path.slice(-1)[0],
    //       chatRoomId);
    // });
  }

  listenToPlayerMissionMembership_(gameId, playerId, missionId) {
    this.listenOnce_(`/players/${playerId}/missions/${missionId}`).then((snap) => {
      let obj = new Model.PlayerMissionMembership(missionId, {missionId: missionId});
      this.writer.insert(this.reader.getPlayerMissionMembershipPath(gameId, playerId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, PLAYER_MISSION_MEMBERSHIP_PROPERTIES, PLAYER_MISSION_MEMBERSHIP_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getPlayerMissionMembershipPath(gameId, playerId, missionId).concat([property]), value);
          });
    });
    // ref.on("child_removed", (snap) => {
    //   let chatRoomId = snap.getKey();
    //   let path = this.reader.getPlayerChatRoomMembershipPath(gameId, playerId, chatRoomId);
    //   this.writer.remove(
    //       path.slice(0, path.length - 1),
    //       path.slice(-1)[0],
    //       chatRoomId);
    // });
  }

  listenToGroupMembership_(gameId, groupId, playerId) {
    this.listenOnce_(`/groups/${groupId}/players/${playerId}`).then((snap) => {
      let obj = new Model.GroupMembership(playerId, {playerId: playerId});
      this.writer.insert(this.reader.getGroupMembershipPath(gameId, groupId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, GROUP_MEMBERSHIP_PROPERTIES, GROUP_MEMBERSHIP_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getGroupMembershipPath(gameId, groupId, membershipId).concat([property]), value);
          });
    });
    // ref.on("child_removed", (snap) => {
    // });
  }


  listenToRewardCategory_(gameId, rewardCategoryId) {
    this.listenOnce_(`/rewardCategories/${rewardCategoryId}`).then((snap) => {
      let obj = new Model.RewardCategory(rewardCategoryId, snap.val());
      this.writer.insert(this.reader.getRewardCategoryPath(gameId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, REWARD_CATEGORY_PROPERTIES, REWARD_CATEGORY_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getRewardCategoryPath(gameId, rewardCategoryId).concat([property]), value);
          });
      this.firebaseRoot.child(`/rewardCategories/${rewardCategoryId}/rewards`)
          .on("child_added", (snap) => this.listenToReward_(gameId, rewardCategoryId, snap.getKey()));
    });
  }

  listenToReward_(gameId, rewardCategoryId, rewardId) {
    this.listenOnce_(`/rewardCategories/${rewardCategoryId}/rewards/${rewardId}`).then((snap) => {
      let obj = new Model.Reward(rewardId, snap.val());
      this.writer.insert(this.reader.getRewardPath(gameId, rewardCategoryId, null), null, obj);
      this.listenForPropertyChanges_(
          snap.ref, REWARD_PROPERTIES, REWARD_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getRewardPath(gameId, rewardCategoryId, rewardId).concat([property]), value);
          });
    });
  }








  // listenToQuizQuestion_(gameId, questionId) {
  //   this.firebaseRoot.child("games/${gameId}/quizQuestions/" + questionId)
  //       .once("value").then((snap) => {
  //     let quizQuestionId = snap.getKey();
  //     let obj = new Model.QuizQuestion(quizQuestionId, snap.val());
  //     this.writer.insert(this.reader.getQuizQuestionPath(gameId, null), null, obj);
  //     this.listenForPropertyChanges_(
  //         snap.ref, QUIZ_QUESTION_PROPERTIES, QUIZ_QUESTION_COLLECTIONS,
  //         (property, value) => {
  //           this.writer.set(this.reader.getQuizQuestionPath(gameId, quizQuestionId).concat([property]), value);
  //         });
  //     this.firebaseRoot.child(`games/${gameId}/quizQuestions/${quizQuestionId}/answers`)
  //         .on("child_added", (snap) => this.listenToQuizAnswer_(gameId, questionId, snap.getKey()));
  //   });
  // }

  // listenToQuizAnswer_(gameId, quizQuestionId, quizAnswerId) {
  //   this.firebaseRoot.child("games/${gameId}/quizQuestions/${questionId}/answers/" + quizAnswerId)
  //       .once("value").then((snap) => {
  //     let quizAnswerId = snap.getKey();
  //     let obj = new Model.QuizAnswer(quizAnswerId, snap.val());
  //     this.writer.insert(this.reader.getQuizAnswerPath(gameId, quizQuestionId, null), null, obj);
  //     this.listenForPropertyChanges_(
  //         snap.ref, QUIZ_ANSWER_PROPERTIES, QUIZ_ANSWER_COLLECTIONS,
  //         (property, value) => {
  //           this.writer.set(this.reader.getQuizAnswerPath(gameId, quizQuestionId, quizAnswerId).concat([property]), value);
  //         });
  //   });
  // }

  // // listenToMissions_(gameId, currentPlayerId) {
  // //   let collectionRef =
  // //       currentPlayerId ?
  // //           this.firebaseRoot.child(`players/${currentPlayerId}/missions`) :
  // //           this.firebaseRoot.child(`games/${gameId}/missions`);
  // //   collectionRef.on("child_added", (snap) => {
  // //     this.listenToMission_(
  // //   });
  // // }

  // listenToGroups_(gameId, currentPlayerId) {
  //   let collectionRef =
  //       currentPlayerId ?
  //           this.firebaseRoot.child(`players/${currentPlayerId}/groups`) :
  //           this.firebaseRoot.child(`games/${gameId}/groups`);
  //   collectionRef.on("child_added", (snap) => {
  //     let groupId = snap.getKey(); // snap.val() is ""
  //     let ref = this.firebaseRoot.child("groups/" + groupId);
  //     ref.once("value")
  //         .then((snap) => {
  //           let obj = new Model.Group(groupId, snap.val());
  //           this.writer.insert(this.reader.getGroupPath(gameId, null), null, obj);
  //           this.listenForPropertyChanges_(
  //               snap.ref, GROUP_PROPERTIES, GROUP_COLLECTIONS.concat(["players"]),
  //               (property, value) => {
  //                 this.writer.set(this.reader.getGroupPath(gameId, groupId).concat([property]), value);
  //               });
  //           this.listenToGroupMemberships_(gameId, groupId);
  //         });
  //   });
  // }

  // listenToNotificationCategories_(gameId, currentPlayerId) {
  //   let collectionRef =
  //       currentPlayerId ?
  //           this.firebaseRoot.child(`players/${currentPlayerId}/notificationCategories`) :
  //           this.firebaseRoot.child(`games/${gameId}/notificationCategories`);
  //   collectionRef.on("child_added", (snap) => {
  //     let notificationCategoryId = snap.getKey(); // snap.val() is ""
  //     let ref = this.firebaseRoot.child("notificationCategories/" + notificationCategoryId);
  //     ref.once("value")
  //         .then((snap) => {
  //           let obj = new Model.NotificationCategory(notificationCategoryId, snap.val());
  //           this.writer.insert(this.reader.getNotificationCategoryPath(gameId, null), null, obj);
  //           this.listenForPropertyChanges_(
  //               snap.ref, CHAT_ROOM_PROPERTIES, CHAT_ROOM_COLLECTIONS,
  //               (property, value) => {
  //                 this.writer.set(this.reader.getNotificationCategoryPath(gameId, notificationCategoryId).concat([property]), value);
  //               });
  //         });
  //   });
  // }



  // listenToChatRoomMessages_(gameId, chatRoomId) {
  //   var ref = this.firebaseRoot.child(`/chatRooms/${chatRoomId}/messages`);
  //   ref.on("child_added", (snap) => {
  //     let messageId = snap.getKey();
  //     let obj = new Model.Message(messageId, snap.val());
  //     let insertIndex =
  //         Utils.findInsertIndex(
  //             this.reader.get(this.reader.getChatRoomMessagePath(gameId, chatRoomId, null)),
  //             obj.index);
  //     this.writer.insert(
  //         this.reader.getChatRoomMessagePath(gameId, chatRoomId),
  //         insertIndex,
  //         obj)
  //     this.listenForPropertyChanges_(
  //         snap.ref, MESSAGE_PROPERTIES, MESSAGE_COLLECTIONS,
  //         (property, value) => {
  //           this.writer.set(this.reader.getChatRoomMessagePath(gameId, chatRoomId, messageId).concat([property]), value);
  //         });
  //   });
  // }

  // listenToLives_(playerId, gameId) {
  //   var ref = this.firebaseRoot.child(`players/${playerId}/lives`);
  //   ref.on("child_added", (snap) => {
  //     let lifeId = snap.getKey();
  //     let obj = new Model.Life(lifeId, snap.val());
  //     this.writer.insert(this.reader.getLifePath(gameId, playerId, null), null, obj);
  //     this.listenForPropertyChanges_(
  //         snap.ref, LIFE_PROPERTIES, LIFE_COLLECTIONS,
  //         (property, value) => {
  //           this.writer.set(this.reader.getLifePath(gameId, playerId, lifeId).concat([property]), value);
  //         });
  //   });
  // }

  //   // var ref = this.firebaseRoot.child("/groups/" + groupId);
  //   // ref.on("child_added", (snap) => {
  //   //   let lifeId = snap.getKey();
  //   //   let obj = new Model.Life(lifeId, snap.val());
  //   //   this.writer.insert(this.reader.getLifePath(gameId, playerId, null), null, obj);
  //   //   this.listenForPropertyChanges_(
  //   //       snap.ref, LIFE_PROPERTIES, LIFE_COLLECTIONS,
  //   //       (property, value) => {
  //   //         this.writer.set(this.reader.getLifePath(gameId, playerId, lifeId).concat([property]), value);
  //   //       });
  //   // });
  // }

  // listenToNotifications_(playerId, gameId) {
  //   var ref = this.firebaseRoot.child(`/players/${playerId}/notifications`);
  //   ref.on("child_added", (snap) => {
  //     let notificationCategoryId = snap.getKey();
  //     snap.ref.on("child_added", (snap) => {
  //       let notificationId = snap.getKey();
  //       let obj = new Model.Notification(notificationId, snap.val());
  //       obj.notificationCategoryId = notificationCategoryId;
  //       this.writer.insert(this.reader.getNotificationPath(gameId, playerId, null), null, obj);
  //       this.listenForPropertyChanges_(
  //           snap.ref, NOTIFICATION_PROPERTIES, NOTIFICATION_COLLECTIONS,
  //           (property, value) => {
  //             this.writer.set(this.reader.getNotificationPath(gameId, playerId, notificationId).concat([property]), value);
  //           });
  //     });
  //   });
  // }

}

return FirebaseListener;

})();