// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO: High-level file comment.

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

  // const Model.USER_PROPERTIES = ['a', 'deviceToken'];
  // const Model.USER_COLLECTIONS = ['players', 'games'];
  // const Model.GAME_PROPERTIES = ['active', 'startTime', 'endTime', 'registrationEndTime', 'name', 'number', 'rulesHtml', 'faqHtml', 'stunTimer', 'adminContactPlayerId'];
  // const Model.GAME_COLLECTIONS = ['guns', 'missions', 'rewardCategories', 'chatRooms', 'players', 'admins', 'queuedNotifications', 'quizQuestions', 'groups', 'maps'];
  // const Model.GUN_PROPERTIES = ['gameId', 'playerId', 'label'];
  // const Model.GUN_COLLECTIONS = [];
  // const Model.PRIVATE_PLAYER_PROPERTIES = ['beInPhotos', 'gameId', 'userId', 'canInfect', 'needGun', 'startAsZombie', 'wantToBeSecretZombie', 'gotEquipment', 'notes'];
  // const Model.PRIVATE_PLAYER_NOTIFICATION_SETTINGS_PROPERTIES = ['sound', 'vibrate'];
  // const Model.PRIVATE_PLAYER_VOLUNTEER_PROPERTIES = ['advertising', 'logistics', 'communications', 'moderator', 'cleric', 'sorcerer', 'admin', 'photographer', 'chronicler', 'android', 'ios', 'server', 'client'];
  // const Model.PRIVATE_PLAYER_COLLECTIONS = ['lives', 'chatRoomMemberships', 'missionMemberships', 'notifications'];
  // const Model.USER_PLAYER_PROPERTIES = ['gameId', 'userId'];
  // const Model.USER_PLAYER_COLLECTIONS = [];
  // const Model.GROUP_PROPERTIES = ['name', 'gameId', 'allegianceFilter', 'autoAdd', 'canAddOthers', 'canRemoveOthers', 'canAddSelf', 'canRemoveSelf', 'autoRemove', 'ownerPlayerId'];
  // const Model.GROUP_COLLECTIONS = ['players'];
  // const Model.CHAT_ROOM_PROPERTIES = ['gameId', 'name', 'accessGroupId', 'withAdmins'];
  // const Model.CHAT_ROOM_COLLECTIONS = ['messages', 'acks'];
  // const Model.GROUP_MEMBERSHIP_PROPERTIES = ['playerId'];
  // const Model.GROUP_MEMBERSHIP_COLLECTIONS = [];
  // const Model.PLAYER_CHAT_ROOM_MEMBERSHIP_PROPERTIES = ['chatRoomId'];
  // const Model.PLAYER_CHAT_ROOM_MEMBERSHIP_COLLECTIONS = [];
  // const Model.PLAYER_MISSION_MEMBERSHIP_PROPERTIES = ['missionId'];
  // const Model.PLAYER_MISSION_MEMBERSHIP_COLLECTIONS = [];
  // const Model.MESSAGE_PROPERTIES = ['index', 'message', 'playerId', 'time', 'image', 'location'];
  // const Model.MESSAGE_COLLECTIONS = [];
  // const Model.MISSION_PROPERTIES = ['gameId', 'name', 'beginTime', 'endTime', 'detailsHtml', 'accessGroupId', 'rsvpersGroupId'];
  // const Model.MISSION_COLLECTIONS = [];
  // const Model.ADMIN_PROPERTIES = ['userId'];
  // const Model.ADMIN_COLLECTIONS = [];
  // const Model.PLAYER_PROPERTIES = ['active', 'userId', 'number', 'allegiance', 'name', 'points', 'profileImageUrl'];
  // const Model.PLAYER_COLLECTIONS = ['infections', 'lives', 'claims', 'notifications', 'groupMemberships'];
  // const Model.CLAIM_PROPERTIES = ['time', 'rewardId', 'rewardCategoryId'];
  // const Model.CLAIM_COLLECTIONS = [];
  // const Model.PUBLIC_LIFE_PROPERTIES = ['time'];
  // const Model.PUBLIC_LIFE_COLLECTIONS = [];
  // const Model.PRIVATE_LIFE_PROPERTIES = ['code'];
  // const Model.PRIVATE_LIFE_COLLECTIONS = [];
  // const Model.INFECTION_PROPERTIES = ['time', 'infectorId'];
  // const Model.INFECTION_COLLECTIONS = [];
  // const Model.NOTIFICATION_PROPERTIES = ["message", "previewMessage", "queuedNotificationId", "seenTime", "sound", "vibrate", "site", "mobile", "time", "email", "destination"];
  // const Model.NOTIFICATION_COLLECTIONS = [];
  // const Model.REWARD_CATEGORY_PROPERTIES = ['name', 'description', 'shortName', 'points', 'shortName', 'claimed', 'gameId', 'limitPerPlayer', 'badgeImageUrl'];
  // const Model.REWARD_CATEGORY_COLLECTIONS = ['rewards'];
  // const Model.REWARD_PROPERTIES = ['gameId', 'rewardCategoryId', 'playerId', 'code'];
  // const Model.REWARD_COLLECTIONS = [];
  // const Model.QUIZ_QUESTION_PROPERTIES = ["text", "type", "number"];
  // const Model.QUIZ_QUESTION_COLLECTIONS = ["answers"];
  // const Model.QUIZ_ANSWER_PROPERTIES = ["text", "isCorrect", "order", "number"];
  // const Model.QUIZ_ANSWER_COLLECTIONS = [];

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
  // /chatRooms/[chatRoomId], /publicPlayers/[playerId],
  // /privatePlayers/[playerId], etc.

  // listenToGameAsPlayer can't take that approach, because since we're not an
  // admin, we can't just blindly listen to everything. To know what we have
  // access to, we look at /privatePlayers/[playerId]/chatRooms,
  // /privatePlayers/[playerId]/missions, etc. which are lists of IDs, and
  // use those IDs to start listening to /missions/[missionId],
  // /chatRooms/[chatRoomId], etc.

  class FirebaseListener {
    constructor(firebaseRoot) {
      this.destination = new TeeWriter();

      this.listenedToPaths = {};

      this.firebaseRoot = firebaseRoot;
    }

    setupPrivateModelAndReaderAndWriter(privateModelGame) {
      // We can read it with this...
      this.reader =
        // ...which is a PathFindingReader, something that has specific
        // knowledge of our model, and has methods like
        // getLifePath(playerId, lifeId) which are super convenient.
        new PathFindingReader(
          // The PathFindingReader isn't given a plain object, it's given a
          // reader, which has a get(path) method.
          new SimpleReader(
            // The simple reader will read from our plain object.
            privateModelGame));

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
        }
        attempt();
      });
        
      return this.firebaseRoot.child(path).once('value');
    }

    unlisten_(path) {
      delete this.listenedToPaths[path];
    }

    listenToGame(listeningUserId, gameId, destination) {
      console.log('listening to a game!', listeningUserId, gameId);
      this.destination.addDestination(destination);
      this.listenOnce_(`/games/${gameId}`).then((snap) => {
        let firebaseGame = snap.val();
        let modelGame = new Model.Game(gameId, firebaseGame);
        this.setupPrivateModelAndReaderAndWriter(modelGame);
        this.writer.set([], modelGame);
        this.listenForPropertyChanges_(
          snap.ref, Model.GAME_PROPERTIES, Model.GAME_COLLECTIONS.concat(['missionMemberships', 'chatRoomMemberships', 'adminUsers', 'queuedNotifications', 'groups']),
          (property, value) => {
            this.writer.set([property], value);
          });
        this.firebaseRoot.child(`/games/${gameId}/adminUsers`)
          .on('child_added', (snap) => this.listenToAdmin_(gameId, snap.getKey()));
        this.firebaseRoot.child(`/games/${gameId}/guns`)
          .on('child_added', (snap) => this.listenToGun_(snap.getKey()));
        this.firebaseRoot.child(`/games/${gameId}/quizQuestions`)
          .on('child_added', (snap) => this.listenToQuizQuestion_(gameId, snap.getKey()));
        this.firebaseRoot.child(`/games/${gameId}/rewardCategories`)
            .on('child_added', (snap) => this.listenToRewardCategory_(snap.getKey()));

        if (listeningUserId in firebaseGame.adminUsers) {
          this.firebaseRoot.child(`/games/${gameId}/players`)
            .on('child_added', (snap) => this.listenToPlayer_(snap.getKey(), listeningUserId, true));
          this.firebaseRoot.child(`/games/${gameId}/groups`)
            .on('child_added', (snap) => this.listenToGroup_(snap.getKey()));
          this.firebaseRoot.child(`/games/${gameId}/missions`)
            .on('child_added', (snap) => this.listenToMission_(snap.getKey()));
          this.firebaseRoot.child(`/games/${gameId}/missions`)
            .on('child_removed', (snap) => {
              let missionId = snap.getKey();
              let path = this.reader.getMissionPath(missionId);
              let index = path[path.length - 1];
              path = path.slice(0, path.length - 1);
              this.writer.remove(path, index, missionId);
            });
          this.firebaseRoot.child(`/games/${gameId}/chatRooms`)
            .on('child_added', (snap) => this.listenToChatRoom_(snap.getKey()));
          this.firebaseRoot.child(`/games/${gameId}/queuedNotifications`)
            .on('child_added', (snap) => this.listenToQueuedNotification_(snap.getKey()));
        } else {
          this.firebaseRoot.child(`/games/${gameId}/players`)
            .on('child_added', (snap) => this.listenToPlayer_(snap.getKey(), listeningUserId, false));
        }
      });
    }

    listenToGun_(gunId) {
      this.listenOnce_(`/guns/${gunId}`).then((snap) => {
        let gunId = snap.getKey();
        let obj = new Model.Gun(gunId, snap.val());
        this.writer.insert(this.reader.getGunPath(null), null, obj);
        this.listenForPropertyChanges_(
          snap.ref, Model.GUN_PROPERTIES, Model.GUN_COLLECTIONS.concat(['a']),
          (property, value) => {
            this.writer.set(this.reader.getGunPath(gunId).concat([property]), value);
          });
      });
    }

    listenToAdmin_(gameId, userId) {
      this.listenOnce_(`/games/${gameId}/adminUsers/${userId}`).then((snap) => {
        let obj = new Model.Admin(userId, {
          userId: userId
        });
        this.writer.insert(this.reader.getAdminPath(null), null, obj);
        this.listenForPropertyChanges_(
          snap.ref, Model.ADMIN_PROPERTIES, Model.ADMIN_COLLECTIONS.concat(['a']),
          (property, value) => {
            this.writer.set(this.reader.getAdminPath(userId).concat([property]), value);
          });
      });
    }

    listenToPlayer_(publicPlayerId, listeningUserId, listeningAsAdmin) {
      this.listenOnce_(`/publicPlayers/${publicPlayerId}`).then((publicSnap) => {
        let publicPlayer = new Model.PublicPlayer(publicPlayerId, publicSnap.val());
        this.writer.insert(this.reader.getPublicPlayerPath(null), null, publicPlayer);

        let listenToPrivate = listeningAsAdmin || (publicPlayer.userId == listeningUserId)

        this.listenForPropertyChanges_(
          publicSnap.ref, Model.PUBLIC_PLAYER_PROPERTIES, Model.PUBLIC_PLAYER_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getPublicPlayerPath(publicPlayerId).concat([property]), value);
          });
        this.firebaseRoot.child(`/publicPlayers/${publicPlayerId}/claims`)
          .on('child_added', (publicSnap) => this.listenToClaim_(publicPlayerId, publicSnap.getKey()));
        this.firebaseRoot.child(`/publicPlayers/${publicPlayerId}/infections`)
          .on('child_added', (publicSnap) => this.listenToInfection_(publicPlayerId, publicSnap.getKey()));
        this.firebaseRoot.child(`/publicPlayers/${publicPlayerId}/lives`)
          .on('child_added', (publicSnap) => this.listenToLife_(publicPlayerId, publicSnap.getKey(), listenToPrivate));

        if (listenToPrivate) {
          let privatePlayerId = publicPlayer.privatePlayerId;
          this.listenOnce_(`/privatePlayers/${privatePlayerId}`).then((privateSnap) => {
              let privatePlayer = new Model.PrivatePlayer(privatePlayerId, privateSnap.val());
              this.writer.set(this.reader.getPrivatePlayerPath(publicPlayerId), privatePlayer);

              this.listenForPropertyChanges_(
                privateSnap.ref,
                Model.PRIVATE_PLAYER_PROPERTIES,
                Model.PRIVATE_PLAYER_COLLECTIONS.concat("volunteer", "notificationSettings"),
                (property, value) => {
                  this.writer.set(this.reader.getPrivatePlayerPath(publicPlayerId).concat([property]), value);
                });
              this.listenForPropertyChanges_(
                privateSnap.ref.child('volunteer'),
                Model.PRIVATE_PLAYER_VOLUNTEER_PROPERTIES, [],
                (property, value) => {
                  this.writer.set(this.reader.getPrivatePlayerPath(publicPlayerId).concat(['volunteer', property]), value);
                });
              this.listenForPropertyChanges_(
                privateSnap.ref.child('notificationSettings'),
                Model.PRIVATE_PLAYER_NOTIFICATION_SETTINGS_PROPERTIES, [],
                (property, value) => {
                  this.writer.set(this.reader.getPrivatePlayerPath(publicPlayerId).concat(['notificationSettings', property]), value);
                });
              this.firebaseRoot.child(`/privatePlayers/${privatePlayerId}/notifications`)
                .on('child_added', (snap) => {
                  let notificationId = snap.getKey();
                  let queuedNotificationId = snap.getKey();
                  this.listenToNotification_(publicPlayerId, privatePlayerId, notificationId);
                });
              this.firebaseRoot.child(`/privatePlayers/${privatePlayerId}/chatRoomMemberships`)
                .on('child_added', (snap) => {
                  let chatRoomId = snap.getKey();
                  this.listenToPlayerChatRoomMembership_(publicPlayerId, privatePlayerId, chatRoomId);
                  this.listenToChatRoom_(chatRoomId);
                });
              this.firebaseRoot.child(`/privatePlayers/${privatePlayerId}/chatRoomMemberships`)
                .on('child_removed', (snap) => {
                  let chatRoomId = snap.getKey();
                  let path = this.reader.getPlayerChatRoomMembershipPath(publicPlayerId, chatRoomId);
                  let index = path[path.length - 1];
                  path = path.slice(0, path.length - 1);
                  this.writer.remove(path, index, chatRoomId);
                });
              this.firebaseRoot.child(`/privatePlayers/${privatePlayerId}/missionMemberships`)
                .on('child_added', (snap) => {
                  let missionId = snap.getKey();
                  this.listenToPlayerMissionMembership_(publicPlayerId, privatePlayerId, missionId);
                  this.listenToMission_(missionId);
                });
              this.firebaseRoot.child(`/privatePlayers/${privatePlayerId}/missionMemberships`)
                .on('child_removed', (snap) => {
                  let missionId = snap.getKey();
                  let path = this.reader.getPlayerMissionMembershipPath(publicPlayerId, missionId);
                  let index = path[path.length - 1];
                  path = path.slice(0, path.length - 1);
                  this.writer.remove(path, index, missionId);
                });
            });
          }
      });
    }

    listenToLife_(playerId, publicLifeId, listenToPrivate) {
      this.listenOnce_(`/publicLives/${publicLifeId}`).then((publicSnap) => {
        let publicLife = new Model.PublicLife(publicLifeId, publicSnap.val());
        this.writer.insert(this.reader.getPublicLifePath(playerId, null), null, publicLife);
        this.listenForPropertyChanges_(
            publicSnap.ref, Model.PUBLIC_LIFE_PROPERTIES, Model.PUBLIC_LIFE_COLLECTIONS,
            (property, value) => {
              this.writer.set(this.reader.getPublicLifePath(playerId, publicLifeId).concat([property]), value);
            });
        if (listenToPrivate) {
          let privateLifeId = publicLife.privateLifeId;
          this.listenOnce_(`/privateLives/${privateLifeId}`).then((privateSnap) => {
              let privateLife = new Model.PrivateLife(privateLifeId, privateSnap.val());
              this.writer.set(this.reader.getPrivateLifePath(playerId, publicLifeId), privateLife);
              this.listenForPropertyChanges_(
                privateSnap.ref, Model.PRIVATE_LIFE_PROPERTIES, Model.PRIVATE_LIFE_COLLECTIONS,
                (property, value) => {
                  this.writer.set(this.reader.getPrivateLifePath(playerId, publicLifeId).concat([property]), value);
                });
            });
        }
      });
    }

    listenToInfection_(playerId, infectionId) {
      this.listenOnce_(`/publicPlayers/${playerId}/infections/${infectionId}`).then((snap) => {
        let infectionId = snap.getKey();
        let obj = new Model.Infection(infectionId, snap.val());
        this.writer.insert(this.reader.getInfectionPath(playerId, null), null, obj);
        this.listenForPropertyChanges_(
          snap.ref, Model.INFECTION_PROPERTIES, Model.INFECTION_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getInfectionPath(playerId, infectionId).concat([property]), value);
          });
      });
    }

    listenToClaim_(playerId, claimId) {
      this.listenOnce_(`/publicPlayers/${playerId}/claims/${claimId}`).then((snap) => {
        let claimId = snap.getKey();
        let obj = new Model.Claim(claimId, snap.val());
        this.writer.insert(this.reader.getClaimPath(playerId, null), null, obj);
        this.listenForPropertyChanges_(
          snap.ref, Model.CLAIM_PROPERTIES, Model.CLAIM_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getClaimPath(playerId, claimId).concat([property]), value);
          });
      });
    }

    listenToMission_(missionId) {
      this.listenOnce_(`/missions/${missionId}`).then((snap) => {
        let obj = new Model.Mission(missionId, snap.val());
        this.writer.insert(this.reader.getMissionPath(null), null, obj);
        this.listenToGroup_(obj.accessGroupId);
        this.listenForPropertyChanges_(
          snap.ref, Model.MISSION_PROPERTIES, Model.MISSION_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getMissionPath(missionId).concat([property]), value);
          });
      });
    }

    listenToGroup_(groupId) {
      this.listenOnce_(`/groups/${groupId}`).then((snap) => {
        let obj = new Model.Group(groupId, snap.val());
        this.writer.insert(this.reader.getGroupPath(null), null, obj);
        this.listenForPropertyChanges_(
          snap.ref, Model.GROUP_PROPERTIES, Model.GROUP_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getGroupPath(groupId).concat([property]), value);
          });
        this.firebaseRoot.child(`/groups/${groupId}/players`)
            .on('child_added', (snap) => {
              let playerId = snap.getKey();
              this.writer.insert(this.reader.getGroupPlayerPath(groupId, null), null, playerId);
            });
        this.firebaseRoot.child(`/groups/${groupId}/players`)
            .on('child_removed', (snap) => {
              let playerId = snap.getKey();
              let path = this.reader.getGroupPlayerPath(groupId, playerId)
              let index = path[path.length - 1];
              path = path.slice(0, path.length - 1);
              this.writer.remove(path, index, playerId);
            });
      });
    }

    listenToNotification_(publicPlayerId, privatePlayerId, notificationId) {
      this.listenOnce_(`/privatePlayers/${privatePlayerId}/notifications/${notificationId}`).then((snap) => {
        let obj = new Model.Notification(notificationId, snap.val());
        this.writer.insert(this.reader.getNotificationPath(publicPlayerId, null), null, obj);
        this.listenForPropertyChanges_(
          snap.ref, Model.NOTIFICATION_PROPERTIES, Model.NOTIFICATION_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getNotificationPath(publicPlayerId, notificationId).concat([property]), value);
          });
      });
    }

    listenToChatRoom_(chatRoomId) {
      this.listenOnce_(`/chatRooms/${chatRoomId}`).then((snap) => {
        let obj = new Model.ChatRoom(chatRoomId, snap.val());
        this.listenToGroup_(obj.accessGroupId);
        this.writer.insert(this.reader.getChatRoomPath(null), null, obj);
        this.listenForPropertyChanges_(
          snap.ref, Model.CHAT_ROOM_PROPERTIES, Model.CHAT_ROOM_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getChatRoomPath(chatRoomId).concat([property]), value);
          });

        // Only listen to anything more recent than the last 100 messages
        // Temporary, until some day when we split /messages into its own root or something
        let startMessageTimestamp = 0;
        let originalMessages = snap.val().messages || [];
        let messagesMap = snap.val().messages;
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

        this.firebaseRoot.child(`/chatRooms/${chatRoomId}/messages`)
          .on('child_added', (snap) => {
            if (snap.val().time >= startMessageTimestamp) {
              this.listenToChatRoomMessage_(chatRoomId, snap.getKey());
            }
          });
      });
    }

    listenToChatRoomMessage_(chatRoomId, messageId) {
      this.listenOnce_(`/chatRooms/${chatRoomId}/messages/${messageId}`).then((snap) => {
        let obj = new Model.Message(messageId, snap.val());
        let existingMessages = this.reader.get(this.reader.getChatRoomMessagePath(chatRoomId, null));
        let insertIndex =
          existingMessages.findIndex((existing) => existing.time > obj.time);
        if (insertIndex < 0)
          insertIndex = existingMessages.length;
        this.writer.insert(
          this.reader.getChatRoomMessagePath(chatRoomId, null),
          insertIndex,
          obj);
        this.listenForPropertyChanges_(
          snap.ref, Model.MESSAGE_PROPERTIES, Model.MESSAGE_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getChatRoomMessagePath(chatRoomId, messageId).concat([property]), value);
          });
      });
    }

    listenToPlayerChatRoomMembership_(publicPlayerId, privatePlayerId, chatRoomId) {
      this.listenOnce_(`/privatePlayers/${privatePlayerId}/chatRoomMemberships/${chatRoomId}`).then((snap) => {
        let obj =
            new Model.PlayerChatRoomMembership(chatRoomId, Utils.merge(snap.val(), {
              chatRoomId: chatRoomId,
            }));
        this.writer.insert(this.reader.getPlayerChatRoomMembershipPath(publicPlayerId, null), null, obj);
        this.listenForPropertyChanges_(
          snap.ref, Model.PLAYER_CHAT_ROOM_MEMBERSHIP_PROPERTIES, Model.PLAYER_CHAT_ROOM_MEMBERSHIP_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getPlayerChatRoomMembershipPath(publicPlayerId, chatRoomId).concat([property]), value);
          });
      });
    }

    listenToPlayerMissionMembership_(publicPlayerId, privatePlayerId, missionId) {
      this.listenOnce_(`/privatePlayers/${privatePlayerId}/missionMemberships/${missionId}`).then((snap) => {
        let obj = new Model.PlayerMissionMembership(missionId, {
          missionId: missionId
        });
        this.writer.insert(this.reader.getPlayerMissionMembershipPath(publicPlayerId, null), null, obj);
        this.listenForPropertyChanges_(
          snap.ref, Model.PLAYER_MISSION_MEMBERSHIP_PROPERTIES, Model.PLAYER_MISSION_MEMBERSHIP_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getPlayerMissionMembershipPath(publicPlayerId, missionId).concat([property]), value);
          });
      });
    }


    listenToRewardCategory_(rewardCategoryId) {
      this.listenOnce_(`/rewardCategories/${rewardCategoryId}`).then((snap) => {
        let obj = new Model.RewardCategory(rewardCategoryId, snap.val());
        this.writer.insert(this.reader.getRewardCategoryPath(null), null, obj);
        this.listenForPropertyChanges_(
          snap.ref, Model.REWARD_CATEGORY_PROPERTIES, Model.REWARD_CATEGORY_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getRewardCategoryPath(rewardCategoryId).concat([property]), value);
          });
        this.firebaseRoot.child(`/rewardCategories/${rewardCategoryId}/rewards`)
          .on('child_added', (snap) => this.listenToReward_(rewardCategoryId, snap.getKey()));
      });
    }

    listenToReward_(rewardCategoryId, rewardId) {
      this.listenOnce_(`/rewards/${rewardId}`).then((snap) => {
        let obj = new Model.Reward(rewardId, snap.val());
        this.writer.insert(this.reader.getRewardPath(rewardCategoryId, null), null, obj);
        this.listenForPropertyChanges_(
          snap.ref, Model.REWARD_PROPERTIES, Model.REWARD_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getRewardPath(rewardCategoryId, rewardId).concat([property]), value);
          });
      });
    }

    listenToQuizQuestion_(gameId, quizQuestionId) {
      this.listenOnce_(`/games/${gameId}/quizQuestions/${quizQuestionId}`).then((snap) => {
        let obj = new Model.QuizQuestion(quizQuestionId, snap.val());

        let existingQuizQuestions = this.reader.get(this.reader.getQuizQuestionPath(null));
        let insertIndex =
          existingQuizQuestions.findIndex((existing) => existing.number > obj.number);
        if (insertIndex < 0)
          insertIndex = existingQuizQuestions.length;
        this.writer.insert(this.reader.getQuizQuestionPath(null), insertIndex, obj);

        this.listenForPropertyChanges_(
          snap.ref, Model.QUIZ_QUESTION_PROPERTIES, Model.QUIZ_QUESTION_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getQuizQuestionPath(quizQuestionId).concat([property]), value);
          });
        this.firebaseRoot.child(`/games/${gameId}/quizQuestions/${quizQuestionId}/answers`)
          .on('child_added', (snap) => this.listenToQuizAnswer_(gameId, quizQuestionId, snap.getKey()));
      });
    }

    listenToQuizAnswer_(gameId, quizQuestionId, quizAnswerId) {
      this.listenOnce_(`/games/${gameId}/quizQuestions/${quizQuestionId}/answers/${quizAnswerId}`).then((snap) => {
        let obj = new Model.QuizAnswer(quizAnswerId, snap.val());

        let existingQuizAnswers = this.reader.get(this.reader.getQuizAnswerPath(quizQuestionId, null));
        let insertIndex =
          existingQuizAnswers.findIndex((existing) => existing.number > obj.number);
        if (insertIndex < 0)
          insertIndex = existingQuizAnswers.length;
        this.writer.insert(this.reader.getQuizAnswerPath(quizQuestionId, null), insertIndex, obj);
        
        this.listenForPropertyChanges_(
          snap.ref, Model.QUIZ_ANSWER_PROPERTIES, Model.QUIZ_ANSWER_COLLECTIONS,
          (property, value) => {
            this.writer.set(this.reader.getQuizAnswerPath(quizQuestionId, quizAnswerId).concat([property]), value);
          });
      });
    }
  }

  return FirebaseListener;

})();
