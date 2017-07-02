'use strict';

window.FirebaseListener = (function () {

  // This class's job is to listen to firebase, which is laid out like the json
  // in sample_firebase.json, and turn it into a json object like in
  // sample_model.json.
  // The key differences:
  // - In firebase, everything is a map of ID to object. In the model, everything
  //   is just an array. Polymer's dom-repeat needs arrays, while firebase doesn't
  //   play well with arrays. FirebaseListener is what makes that transformation.
  // - In firebase, things are denormalized into root-level tables, because of
  //   limitations of its security model (a .read rule overrides any .read rules
  //   below it, so you can't have a public chat room each with private messages,
  //   for example). In the model, everything (except User) is under a game, in a
  //   hierarchy, because it's easier for polymer to understand.

  // Once the outside code constructs FirebaseListener, it should soon afterwards
  // call listenToUser.

  // listenToUser will start listening to the /users/[userId] and will also start
  // listening shallowly to everything under /games, so that elsewhere in the
  // code we can decide which game to listen more closely to, and how to listen
  // to it (whether as an admin or regular player).

  // Sometime after listenToUser, the outside code should call
  // listenToGameAsAdmin or listenToGameAsPlayer.

  // listenToGameAsAdmin will listen in a somewhat straightforward way; it will
  // look at /games/[gameId], see /games/[gameId]/missions,
  // /games/[gameId]/chatRooms, /games/[gameId]/players, etc. which are lists of
  // IDS, and use those IDs to start listening to /missions/[missionId],
  // /chatRooms/[chatRoomId], /playersPublic/[playerId],
  // /playersPrivate/[playerId], etc.

  // listenToGameAsPlayer can't take that approach, because since we're not an
  // admin, we can't just blindly listen to everything. To know what we have
  // access to, we look at /playersPrivate/[playerId]/chatRooms,
  // /playersPrivate/[playerId]/missions, etc. which are lists of IDs, and
  // use those IDs to start listening to /missions/[missionId],
  // /chatRooms/[chatRoomId], etc.

  class FirebaseListener {
    constructor(firebaseRoot) {
      this.destination = new TeeWriter();

      this.listenedToPaths = {};

      this.firebaseRoot = firebaseRoot;

      this.game = {};
    }

    setupPrivateModelAndReaderAndWriter(privateModelGame) {

      this.game = privateModelGame;

      // Whenever we want to change the database, we write to this writer.
      // (a writer is just something that has set/push/remove methods).

      // These writers are chained together such that, when an update gets through
      // the whole pipeline, the resulting object will:
      // - Have corresponding id-to-object maps as well as arrays. For example,
      //   game has a missions array, and also a missionsById map.
      // - Always be consistent; no dangling IDs.
      this.writer =
        // The BatchingWriter just exposes simple .set, .insert, and .remove operations
        // and sends them as batches into its destination writer's batchedWrite method.
        new BatchingWriter(
          // When we write, the TeeWriter takes that write and sends it to
          // two places. We want it to eventually go into our privateModelGame,
          // which we can read, and also the destinationBatchedWriter.
          new TeeWriter(
            // The first place we want to write to will eventually go to our
            // privateModelGame. But we need to set/maintain the
            // convenience mappings (playersById, usersById, etc)
            new MappingWriter(
              // The MappingWriter will send its writes to this SimpleWriter
              // which is a tiny wrapper that just takes set/insert/remove
              // operations and executes them on a plain javascript object.
              new SimpleWriter(privateModelGame)),
            // The second place we want to write to will eventually end up in the
            // destinationBatchedWriter, the ultimate consumer of our work here.
            // But first, lets notice that the TeeWriter just sends the same reference
            // to the same object to two different places, which is very troublesome.
            // This cloning writer will make a copy of the object it's given and
            // send that instead.
            new CloningWriter(
              // We want to maintain the maps on whatever operations we send.
              new MappingWriter(
                // This ConsistentWriter will hold back all of its writes
                // until the right moment, when releasing all of the writes
                // would result in a consistent object (no dangling id references).
                new ConsistentWriter(
                  // The ConsistentWriter expects a GatedWriter, which it can
                  // open and close as it wills (when its consistent, really).
                  // This TimedGatedWriter is a subclass of GatedWriter which
                  // is wired to give up after 2 entire seconds of inconsistency,
                  // and just release the writes anyway.
                  new TimedGatedWriter(
                    // The TimedGatedWriter will give its writes to the destination
                    // TeeWriter, which can be listened to by 0, 1, even 2 or 3 or 100
                    // listeners, but in our case its just 0 or 1.
                    this.destination, true))))));
    }

    listenForPropertyChanges_(collectionRef, properties, ignored, setCallback) {
      assert(collectionRef);
      assert(properties);
      assert(ignored);
      assert(setCallback);
      // We need this for when things go from nonexistant to not-null, such as notification's seenTime
      collectionRef.on('child_added', (change) => {
        if (properties.includes(change.getKey())) {
          setCallback(change.getKey(), change.val());
        } else {
          assert(
            ignored.includes(change.getKey()),
            'Unexpected child_added!', 'Child key:', change.getKey(), 'Child value:', change.val(), arguments);
        }
      });
      collectionRef.on('child_changed', (change) => {
        if (properties.includes(change.getKey())) {
          setCallback(change.getKey(), change.val());
        } else {
          assert(
            ignored.includes(change.getKey()),
            'Unexpected child_changed!', 'Child key:', change.getKey(), 'Child value:', change.val(), arguments);
        }
      });
      // We need this for when things go from something to null
      collectionRef.on('child_removed', (change) => {
        if (properties.includes(change.getKey())) {
          // Do nothing, this means the containing thing is about to disappear too, hopefully
        } else {
          assert(
            ignored.includes(change.getKey()),
            'Unexpected!', change.val(), change.getKey(), arguments);
        }
      });
    }

    listenOnce_(path) {
      if (this.listenedToPaths[path]) {
        // Never resolves
        return new Promise((resolve, reject) => {});
      }
      this.listenedToPaths[path] = true;


      return new Promise((resolve, reject) => {
        let attempt = () => {
          this.firebaseRoot.child(path).once('value').then((snap) => {
            if (snap.val()) {
              resolve(snap);
            } else {
              setTimeout(attempt, 250);
            }
          });
        };
        attempt();
      });
        
      return this.firebaseRoot.child(path).once('value');
    }

    unlisten_(path) {
      delete this.listenedToPaths[path];
    }


    listenGeneric(obj, extraCallback) {
      //this.masterCounter--;
      //if (this.masterCounter == 0) 
      //  this.masterPromiseResolve();
      // console.log(this.masterCounter);
      return this.listenOnce_(obj.link).then((snap) => {
        if (extraCallback && snap.val() == null)
          return extraCallback(null);
        else {
          /*
          let magic = snap.val();
          if (magic !== null) {
            obj._collections.forEach((item) => {
              if (magic.hasOwnProperty(item))
                this.masterCounter += Object.keys(magic[item]).length;
            });
          }
          */
          obj.initialize(snap.val(), this.game, this.writer);
          this.listenForPropertyChanges_(
            snap.ref, obj._properties, obj._collections,
            (property, value) => {
              this.writer.set(obj.path.concat([property]), value);
            });
          if (extraCallback)
            return extraCallback(obj);
          else
            return null;
        }
      });
    }

    listenToGame(listeningUserId, gameId, destination) {
      /*
      // This is an experimental idea, basically I count what should be loaded
      // and then decrement as I load, letting me know when I'm done loading
      // everything in each expected collection
      this.masterCounter = 0;
      this.masterPromise = new Promise((resolve, reject) => {
        this.masterPromiseResolve = resolve;
      });
      */

      console.log('listening to a game!', listeningUserId, gameId);
      this.destination.addDestination(destination);
      this.game = new Model.Game({
        id: gameId,
        gameId: gameId,
        loaded: false // ?
      });
      this.listenOnce_(this.game.link).then((gameSnap) => {
        this.game.initialize(gameSnap.val(), this.game, null, true);
        this.setupPrivateModelAndReaderAndWriter(this.game);
        this.writer.set([], this.game);

        this.firebaseRoot.child(this.game.link + '/adminUsers')
          .on('child_added', (snap) => this.listenToAdmin_(gameId, snap.getKey()));
        this.firebaseRoot.child(this.game.link + '/guns')
          .on('child_added', (snap) => this.listenToGun_(gameId, snap.getKey()));
        this.firebaseRoot.child(this.game.link + '/quizQuestions')
          .on('child_added', (snap) => this.listenToQuizQuestion_(gameId, snap.getKey()));
        this.firebaseRoot.child(this.game.link + '/rewardCategories')
          .on('child_added', (snap) => this.listenToRewardCategory_(gameId, snap.getKey()));

        if (listeningUserId in this.game.adminUsers) {
          this.firebaseRoot.child(this.game.link + '/players')
            .on('child_added', (snap) => this.listenToPlayer_(gameId, snap.getKey(), listeningUserId, true));
          this.firebaseRoot.child(this.game.link + '/groups')
            .on('child_added', (snap) => this.listenToGroup_(gameId, snap.getKey()));
          this.firebaseRoot.child(this.game.link + '/missions')
            .on('child_added', (snap) => this.listenToMission_(gameId, snap.getKey()));
          this.firebaseRoot.child(this.game.link + '/missions')
            .on('child_removed', (snap) => {
              let missionId = snap.getKey();
              let mission = new Model.Mission({
                id: missionId,
                gameId: gameId,
                missionId: missionId
              });
              mission.initialize({}, this.game, null);
              let path = mission.path;
              let index = path[path.length - 1];
              path = path.slice(0, path.length - 1);
              this.writer.remove(path, index, missionId);
            });
          this.firebaseRoot.child(this.game.link + '/chatRooms')
            .on('child_added', (snap) => this.listenToChatRoom_(gameId, snap.getKey()));
          this.firebaseRoot.child(this.game.link + '/queuedNotifications')
            .on('child_added', (snap) => this.listenToQueuedNotification_(gameId, snap.getKey()));
        } else {
          this.firebaseRoot.child(this.game.link + '/players')
            .on('child_added', (snap) => this.listenToPlayer_(gameId, snap.getKey(), listeningUserId, false));
        }
      });
    }

    listenToGun_(gameId, gunId) {
      this.listenGeneric(new Model.Gun({
        id: gunId,
        gunId: gunId,
        gameId: gameId
      }));
    }

    listenToAdmin_(gameId, userId) {
      this.listenGeneric(new Model.Admin({
        id: userId,
        userId: userId,
        gameId: gameId
      }));
    }

    listenToPlayer_(gameId, publicPlayerId, listeningUserId, listeningAsAdmin) {
      this.listenGeneric(new Model.PublicPlayer({
        id: publicPlayerId,
        publicPlayerId: publicPlayerId,
        gameId: gameId
      }), (obj) => {
        let listenToPrivate = listeningAsAdmin || (obj.userId == listeningUserId);

        this.firebaseRoot.child(obj.link + '/claims')
          .on('child_added', (publicSnap) => this.listenToClaim_(gameId, publicPlayerId, publicSnap.getKey()));
        this.firebaseRoot.child(obj.link + '/infections')
          .on('child_added', (publicSnap) => this.listenToInfection_(gameId, publicPlayerId, publicSnap.getKey()));
        this.firebaseRoot.child(obj.link + '/lives')
          .on('child_added', (publicSnap) => this.listenToLife_(gameId, publicPlayerId, publicSnap.getKey(), listenToPrivate));

        if (listenToPrivate) {
          let privatePlayerId = obj.privatePlayerId;
          let privatePlayer = new Model.PrivatePlayer({
            id: privatePlayerId,
            privatePlayerId: privatePlayerId,
            gameId: gameId,
            playerId: publicPlayerId
          });
          privatePlayer.initialize({}, this.game, null, true);
          this.listenOnce_(privatePlayer.link).then((privateSnap) => {
            let privatePlayerPath = privatePlayer.path;
            this.writer.set(privatePlayerPath, privatePlayer); // ?
            this.listenForPropertyChanges_(
              privateSnap.ref,
              privatePlayer._properties,
              privatePlayer._collections.concat('volunteer', 'notificationSettings'),
              (property, value) => {
                this.writer.set(privatePlayerPath.concat([property]), value);
              });

            let v_props = []; // hack around existing solution which combines objects
            for (var vkey in models.volunteer) {
              v_props.push(vkey);
            }
            let n_props = [];
            for (var nkey in models.notificationSettings) {
              n_props.push(nkey);
            }
            this.listenForPropertyChanges_(
              privateSnap.ref.child('volunteer'),
              v_props, [],
              (property, value) => {
                this.writer.set(privatePlayerPath.concat(['volunteer', property]), value);
              });
            this.listenForPropertyChanges_(
              privateSnap.ref.child('notificationSettings'),
              n_props, [],
              (property, value) => {
                this.writer.set(privatePlayerPath.concat(['notificationSettings', property]), value);
              });
            this.firebaseRoot.child(privatePlayer.link + '/notifications')
              .on('child_added', (snap) => {
                let notificationId = snap.getKey();
                this.listenToNotification_(gameId, publicPlayerId, privatePlayerId, notificationId);
              });
            this.firebaseRoot.child(privatePlayer.link + '/chatRoomMemberships')
              .on('child_added', (snap) => {
                let chatRoomId = snap.getKey();
                this.listenToPlayerChatRoomMembership_(gameId, publicPlayerId, privatePlayerId, chatRoomId);
                this.listenToChatRoom_(gameId, chatRoomId);
              });
            this.firebaseRoot.child(privatePlayer.link + '/chatRoomMemberships')
              .on('child_removed', (snap) => {
                let chatRoomId = snap.getKey();
                let chatroom = new Model.PlayerChatRoomMembership({
                  id: chatRoomId,
                  chatRoomId: chatRoomId,
                  gameId: gameId,
                  privatePlayerId: privatePlayerId,
                  publicPlayerId: publicPlayerId
                });
                chatroom.initialize({}, this.game, null);
                let path = chatroom.path;
                let index = path[path.length - 1];
                path = path.slice(0, path.length - 1);
                this.writer.remove(path, index, chatRoomId);
              });
            this.firebaseRoot.child(privatePlayer.link + '/missionMemberships')
              .on('child_added', (snap) => {
                let missionId = snap.getKey();
                this.listenToPlayerMissionMembership_(gameId, publicPlayerId, privatePlayerId, missionId);
                this.listenToMission_(gameId, missionId);
              });
            this.firebaseRoot.child(privatePlayer.link + '/missionMemberships')
              .on('child_removed', (snap) => {
                let missionId = snap.getKey();
                let mission = new Model.PlayerMissionMembership({
                  id: missionId,
                  missionId: missionId,
                  gameId: gameId,
                  privatePlayerId: privatePlayerId,
                  publicPlayerId: publicPlayerId
                });
                mission.initialize({}, this.game, null);
                let path = mission.path;
                let index = path[path.length - 1];
                path = path.slice(0, path.length - 1);
                this.writer.remove(path, index, missionId);
              });
          });
        }
      });
    }

    listenToLife_(gameId, playerId, publicLifeId, listenToPrivate) {
      this.listenGeneric(new Model.PublicLife({
        id: publicLifeId,
        playerId: playerId,
        gameId: gameId
      }), (obj) => {
        if (listenToPrivate) {
          this.listenGeneric(new Model.PrivateLife({
            id: obj.privateLifeId,
            gameId: gameId,
            playerId: publicLifeId
          }));
        }
      });
    }

    listenToInfection_(gameId, playerId, infectionId) {
      this.listenGeneric(new Model.Infection({
        id: infectionId,
        infectionId: infectionId,
        playerId: playerId,
        gameId: gameId
      }));
    }

    listenToClaim_(gameId, playerId, claimId) {
      this.listenGeneric(new Model.Claim({
        id: claimId,
        rewardId: claimId,
        gameId: gameId,
        playerId: playerId
      }));
    }

    listenToMission_(gameId, missionId) {
      this.listenGeneric(new Model.Mission({
        id: missionId,
        missionId: missionId,
        gameId: gameId
      }), (obj) => {
        this.listenToGroup_(gameId, obj.accessGroupId);
      });
    }

    listenToGroup_(gameId, groupId) {
      this.listenGeneric(new Model.Group({
        id: groupId,
        groupId: groupId,
        gameId: gameId
      }), (obj) => {
        this.firebaseRoot.child(obj.link + '/players')
          .on('child_added', (snap) => {
            let playerId = snap.getKey();
            this.writer.insert(obj.path.concat(['players']), null, playerId);
          });
        this.firebaseRoot.child(obj.link + '/players')
          .on('child_removed', (snap) => {
            let playerId = snap.getKey();
            let path = obj.path.concat(['players']);
            path.push(Utils.findIndexById(Utils.get(this.game, path), playerId));
            let index = path[path.length - 1];
            path = path.slice(0, path.length - 1);
            this.writer.remove(path, index, playerId);
          });
      });
    }

    listenToNotification_(gameId, publicPlayerId, privatePlayerId, notificationId) {
      this.listenGeneric(new Model.Notification({
        id: notificationId,
        notificationId: notificationId,
        privatePlayerId: privatePlayerId,
        publicPlayerId: publicPlayerId,
        gameId: gameId
      }));
    }

    listenToChatRoom_(gameId, chatRoomId) {
      this.listenGeneric(new Model.ChatRoom({
        id: chatRoomId,
        chatRoomId: chatRoomId,
        gameId: gameId
      }), (obj) => {
        this.listenToGroup_(gameId, obj.accessGroupId);
        // Only listen to anything more recent than the last 100 messages
        // Temporary, until some day when we split /messages into its own root or something
        let startMessageTimestamp = 0;
        let messagesMap = obj.messages;
        let messages = [];
        for (let messageId in messagesMap) {
          let message = messagesMap[messageId];
          message.id = messageId;
          messages.push(message);
        }
        messages.sort((a, b) => a.time - b.time);
        if (messages.length > 100) {
          let hundredthMostRecentMessage = messages[messages.length - 100];
          startMessageTimestamp = hundredthMostRecentMessage.time;
        }

        this.firebaseRoot.child(obj.link + '/messages')
          .on('child_added', (snap) => {
            if (snap.val().time >= startMessageTimestamp) {
              this.listenToChatRoomMessage_(gameId, chatRoomId, snap.getKey());
            }
          });
      });
    }

    listenToChatRoomMessage_(gameId, chatRoomId, messageId) {
      this.listenGeneric(new Model.Message({
        id: messageId,
        messageId: messageId,
        gameId: gameId,
        chatRoomId: chatRoomId
      }));
    }

    listenToPlayerChatRoomMembership_(gameId, publicPlayerId, privatePlayerId, chatRoomId) {
      this.listenGeneric(new Model.PlayerChatRoomMembership({
        id: chatRoomId,
        gameId: gameId,
        publicPlayerId: publicPlayerId,
        privatePlayerId: privatePlayerId,
        chatRoomId: chatRoomId
      }));
    }

    listenToPlayerMissionMembership_(gameId, playerId, missionId) {
      this.listenGeneric(new Model.PlayerMissionMembership({
        id: missionId,
        gameId: gameId,
        playerId: playerId,
        missionId: missionId
      }));
    }

    listenToRewardCategory_(gameId, rewardCategoryId) {
      this.listenGeneric(new Model.RewardCategory({
        id: rewardCategoryId,
        rewardCategoryId: rewardCategoryId,
        gameId: gameId
      }), (obj) => {
        this.firebaseRoot.child(obj.link + '/rewards')
          .on('child_added', (snap) => this.listenToReward_(gameId, rewardCategoryId, snap.getKey()));
      });
    }

    listenToReward_(gameId, rewardCategoryId, rewardId) {
      this.listenGeneric(new Model.Reward({
        id: rewardId,
        rewardId: rewardId,
        rewardCategoryId: rewardCategoryId,
        gameId: gameId
      }));
    }

    listenToQuizQuestion_(gameId, quizQuestionId) {
      this.listenGeneric(new Model.QuizQuestion({
        id: quizQuestionId,
        quizQuestionId: quizQuestionId,
        gameId: gameId
      }), (obj) => {
        this.firebaseRoot.child(obj.link + '/answers')
          .on('child_added', (snap) => this.listenToQuizAnswer_(gameId, quizQuestionId, snap.getKey()));
      });
    }

    listenToQuizAnswer_(gameId, quizQuestionId, quizAnswerId) {
      this.listenGeneric(new Model.QuizQuestion({
        id: quizAnswerId,
        quizAnswerId: quizAnswerId,
        quizQuestionId: quizAnswerId,
        gameId: gameId
      }));
    }
  }

  return FirebaseListener;

})();