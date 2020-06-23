/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import * as Chat from './data/chat';
import * as ChatUtils from './utils/chatutils';
import * as ClaimCode from './data/claimcode';
import * as Defaults from './data/defaults';
import * as Game from './data/game';
import * as Group from './data/group';
import * as GroupUtils from './utils/grouputils';
import * as Player from './data/player';
import * as PlayerUtils from './utils/playerutils';
import * as Message from './data/message';
import * as Mission from './data/mission';
import * as Reward from './data/reward';
import * as RewardUtils from './utils/rewardutils';
import * as User from './data/user';

admin.initializeApp();
const db = admin.firestore();

/*******************************************************
* USER functions
********************************************************/

exports.registerDevice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
   }

  const deviceToken = data.deviceToken;
  if (!(typeof deviceToken === 'string') || deviceToken.length === 0) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
          'one argument "deviceToken" containing the deviceToken to set.');
    }

  const updatedData = {'deviceToken': deviceToken};
  return await db.collection(User.COLLECTION_PATH).doc(context.auth.uid).set(updatedData);
});



/*******************************************************
* GAME functions
********************************************************/

exports.createGame = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }

  const name = trimmedString(data.name);
  if (name.length === 0) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
          'one argument "name" containing the game name to create.');
   }

  const gameQuery = await db.collection(Game.COLLECTION_PATH).where(Game.FIELD__NAME, "==", name).get();
  if (!gameQuery.empty) {
    throw new functions.https.HttpsError('already-exists', 'A game with the given name already exists');
  }

  const gameData = {
    [Game.FIELD__NAME]: name,
    [Game.FIELD__CREATOR_USER_ID]: context.auth.uid,
  }

  const gameRef = await db.collection(Game.COLLECTION_PATH).add(gameData)
  const gameId = gameRef.id
  await GroupUtils.createManagedGroups(db, context.auth.uid, gameId);

  const adminGroupQuery = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Group.COLLECTION_PATH)
      .where(Group.FIELD__MANAGED, "==", true)
      .where(Group.FIELD__NAME, "==", Defaults.gameAdminChatName)
      .get()

  if (!adminGroupQuery.empty && adminGroupQuery.docs.length === 1) {
    const adminGroupId = adminGroupQuery.docs[0].id
    await gameRef.update({
      [Game.FIELD__ADMIN_GROUP_ID]: adminGroupId
    })
  }

  // Create admin on call player
  const player = Player.create("", Defaults.FIGUREHEAD_ADMIN_NAME);
  const playerDocRef = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Player.COLLECTION_PATH)
      .add(player);

  await GroupUtils.addPlayerToManagedGroups(db, gameId, playerDocRef, /* ignoreAllegiance= */ true)
  await gameRef.update({
    [Game.FIELD__FIGUREHEAD_ADMIN_PLAYER_ACCOUNT]: playerDocRef.id
  })

  return gameId;
});


exports.checkGameExists = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }

  let name = data.name;
  if (!(typeof name === 'string')) {
      throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }
  name = trimmedString(name);
  if (name.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
          'one argument "name" containing the game name to create.');
   }

  const querySnapshot = await db.collection(Game.COLLECTION_PATH).where(Game.FIELD__NAME, "==", name).get();
  if (querySnapshot.empty || querySnapshot.docs.length > 1) {
    throw new functions.https.HttpsError('failed-precondition', 'No game with given name exists.');
  }
});


exports.joinGame = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }
  const uid = context.auth.uid;
  let gameName = data.gameName;
  let playerName = data.playerName;
  if (!(typeof gameName === 'string') || !(typeof playerName === 'string')) {
      throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }
  gameName = trimmedString(gameName);
  playerName = trimmedString(playerName);
  if (gameName.length === 0 || playerName.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
          'one argument "gameName" containing the game name to create and "playerName".');
  }

  const gameQuerySnapshot = await db.collection(Game.COLLECTION_PATH).where(Game.FIELD__NAME, "==", gameName).get();
  if (gameQuerySnapshot.empty || gameQuerySnapshot.docs.length > 1) {
     throw new functions.https.HttpsError('failed-precondition', 'No game with given name exists.');
  }
  const game = gameQuerySnapshot.docs[0];
  const gameId = game.id;
  const userPlayerQuerySnapshot = await PlayerUtils.getUsersPlayersQuery(db, uid, gameId).get();
  if (!userPlayerQuerySnapshot.empty) {
    throw new functions.https.HttpsError('failed-precondition', 'User is already a player in this game.');
  }

  const playerNameQuerySnapshot = await PlayerUtils.getPlayersWithNameQuery(db, gameId, playerName).get();
  if (!playerNameQuerySnapshot.empty) {
      throw new functions.https.HttpsError('failed-precondition', 'Player name already taken.');
  }

  const player = Player.create(uid, playerName);
  const playerDocRef = (await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .add(player));

  await GroupUtils.addPlayerToManagedGroups(db, gameId, playerDocRef, /* ignoreAllegiance= */ false)
  return gameId
});


/**
 * Initiate a recursive delete of documents at a given path.
 *
 * The calling user must be authenticated and have the custom "admin" attribute
 * set to true on the auth token.
 *
 * This delete is NOT an atomic operation and it's possible
 * that it may fail after only deleting some documents.
 *
 * @param {string} data.path the document or collection path to delete.
 */
exports.deleteGame = functions.runWith({
    timeoutSeconds: 540,
    memory: '2GB'
}).https.onCall(async (data, context) => {
    // Only allow admin users to execute this function.
    if (!(context.auth)) {
    /* TODO: only allow for admins once we launch game (&& context.auth.token && context.auth.token.admin) */
      throw new functions.https.HttpsError('permission-denied', 'Must be an administrative user to initiate delete.');
    }

    const gameId = data.gameId;
    console.log(
      `User ${context.auth.uid} has requested to delete game ${gameId}`
    );

    // Run a recursive delete on the game document path.
    const gameRef = db.collection(Game.COLLECTION_PATH).doc(gameId);
    await gameRef.listCollections().then(async (collections: any) => {
      for (const collection of collections) {
        await deleteCollection(collection)
      }
      await gameRef.delete()
    });
});

/*******************************************************
* PLAYER functions
********************************************************/

exports.changePlayerAllegiance = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }
  const gameId = data.gameId;
  const playerId = data.playerId;
  const newAllegiance = data.allegiance;
  if (!(typeof gameId === 'string') || !(typeof playerId === 'string') || !(typeof newAllegiance === 'string')) {
      throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }
  if (gameId.length === 0 || playerId.length === 0 || newAllegiance.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
          'a valid gameId, playerId, and allegiance.');
  }

  await PlayerUtils.internallyChangePlayerAllegiance(db, gameId, playerId, newAllegiance)
});


exports.infectPlayerByLifeCode = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }
  const gameId = data.gameId;
  let lifeCode = data.lifeCode;
  const infectorPlayerId = data.infectorPlayerId

  if (!(typeof gameId === 'string') || !(typeof infectorPlayerId === 'string') || !(typeof lifeCode === 'string')) {
        throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }
  lifeCode = normalizeLifeCode(lifeCode);
  if (gameId.length === 0 || infectorPlayerId.length === 0 || lifeCode.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
            'a valid gameId, playerId, and lifeCode.');
  }

  // Check if life code is associated with valid human player.
  const lifeCodeStatusField = Player.FIELD__LIVES + "." + lifeCode + "." + Player.FIELD__LIFE_CODE_STATUS
  const infectedPlayerQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .where(lifeCodeStatusField, "==", /* isActive= */ true)
    .get()

  if (infectedPlayerQuerySnapshot.empty || infectedPlayerQuerySnapshot.docs.length > 1) {
     throw new functions.https.HttpsError('failed-precondition', 'No valid player with given life code exists.');
  }
  const infectedPlayerSnapshot = infectedPlayerQuerySnapshot.docs[0];
  const infectedPlayerData = await infectedPlayerSnapshot.data()
  if (infectedPlayerData === undefined) {
    return
  }

  // Use up the life code and infect the player if they are out of lives
  if (infectedPlayerData[Player.FIELD__ALLEGIANCE] === Defaults.HUMAN_ALLEGIANCE_FILTER) {
    // Mark life code as used, aka deactivated
    await infectedPlayerSnapshot.ref.update({
      [lifeCodeStatusField]: false
    })
    const lives = infectedPlayerData[Player.FIELD__LIVES]
    if (lives === undefined) {
      return
    }
    for (const key of Object.keys(lives)) {
      const metadata = lives[key]
      if (metadata === undefined) {
        continue
      }
      if (metadata[Player.FIELD__LIFE_CODE_STATUS] === true
          && metadata[Player.FIELD__LIFE_CODE] !== lifeCode) {
        // Player still has some lives left, don't turn them into a zombie.
        console.log("Not turning player to zombie, they still have life codes active.")
        return
      }
    }
    await PlayerUtils.internallyChangePlayerAllegiance(db, gameId, infectedPlayerSnapshot.id, Defaults.ZOMBIE_ALLEGIANCE_FILTER)
  }
});

/*******************************************************
* GROUP functions
********************************************************/

exports.addPlayersToGroup = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }

  const gameId = data.gameId;
  const groupId = data.groupId;
  const playerIdList = data.playerIdList
  if (!(typeof gameId === 'string') || !(typeof groupId === 'string')) {
      throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }
  if (gameId.length === 0 || groupId.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
          'a valid gameId and groupId and chatRoomId.');
  }

  const groupSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Group.COLLECTION_PATH)
    .doc(groupId)
    .get();

  for (const playerId of playerIdList) {
    await GroupUtils.addPlayerToGroup(db, gameId, groupSnapshot, playerId)
  }
});

exports.removePlayerFromGroup = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }

  const gameId = data.gameId;
  const playerId = data.playerId;
  const groupId = data.groupId;
  if (!(typeof gameId === 'string') || !(typeof playerId === 'string') || !(typeof groupId === 'string')) {
      throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }
  if (gameId.length === 0 || playerId.length === 0 || groupId.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
          'a valid gameId, playerId, and chatRoomId.');
  }

  const playerSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .doc(playerId)
    .get()

  const groupSnapshot = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Group.COLLECTION_PATH)
      .doc(groupId)
      .get()
  await GroupUtils.removePlayerFromGroup(db, gameId, groupSnapshot, playerSnapshot)
});


/*******************************************************
* CHAT functions
********************************************************/

exports.addPlayersToChat = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }

  const gameId = data.gameId;
  const groupId = data.groupId;
  const chatRoomId = data.chatRoomId;
  const playerIdList = data.playerIdList
  if (!(typeof gameId === 'string') || !(typeof groupId === 'string') || !(typeof chatRoomId === 'string')) {
      throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }
  if (gameId.length === 0 || groupId.length === 0 || chatRoomId.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
          'a valid gameId and groupId and chatRoomId.');
  }

  const groupDocSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Group.COLLECTION_PATH)
    .doc(groupId)
    .get();

  for (const playerId of playerIdList) {
    await ChatUtils.addPlayerToChat(db, gameId, playerId, groupDocSnapshot, chatRoomId, /* isDocRef= */ false)
  }
});

exports.removePlayerFromChat = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }

  const gameId = data.gameId;
  const playerId = data.playerId;
  const chatRoomId = data.chatRoomId;
  if (!(typeof gameId === 'string') || !(typeof playerId === 'string') || !(typeof chatRoomId === 'string')) {
      throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }
  if (gameId.length === 0 || playerId.length === 0 || chatRoomId.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
          'a valid gameId, playerId, and chatRoomId.');
  }

  const playerSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .doc(playerId)
    .get()

  const chatRoomData = (await db.collection(Game.COLLECTION_PATH)
     .doc(gameId)
     .collection(Chat.COLLECTION_PATH)
     .doc(chatRoomId)
     .get())
     .data();
  if (chatRoomData === undefined) {
    console.log("Chat room was undefined, not removing player.")
    return
  }

  const group = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Group.COLLECTION_PATH)
      .doc(chatRoomData[Chat.FIELD__GROUP_ID])
      .get()

  if (chatRoomData[Chat.FIELD__WITH_ADMINS]) {
    const visibilityField = Player.FIELD__CHAT_MEMBERSHIPS + "." + chatRoomId + "." + Player.FIELD__CHAT_VISIBILITY
    await playerSnapshot.ref.update({
      [visibilityField]: false
    })
    return
  }

  await ChatUtils.removePlayerFromChat(db, gameId, playerSnapshot, group, chatRoomId)
});

// Sends a chat message
// DEPRECATED: We switched to sending chats directly because it's way faster. Keeping this
// around for historical knowledge... will delete once we're sure we don't want this.
/* exports.sendChatMessage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }
  const gameId = data.gameId;
  const chatRoomId = data.chatRoomId;
  const senderId = data.senderId;
  const message = data.message;
  if (!(typeof gameId === 'string')
        || !(typeof chatRoomId === 'string')
        || !(typeof senderId === 'string')
        || !(typeof message === 'string')) {
    throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String and not empty.");
  }
  if (gameId.length === 0 || chatRoomId.length === 0 || senderId.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
            '4 arguments.');
  }
  if (message.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Message was empty, not sending it.');
  }

  // Make sure player is still a member of chat room
  const chatRoom = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Chat.COLLECTION_PATH)
    .doc(chatRoomId)
    .get()
  const group = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Group.COLLECTION_PATH)
    .doc(chatRoom.get(Chat.FIELD__GROUP_ID))
    .get()
  if (group.get(Group.FIELD__MEMBERS).indexOf(senderId) < 0) {
    throw new functions.https.HttpsError('failed-precondition', 'Player is not a member of chat.');
  }

  const messageDocument = Message.create(
    senderId,
    GeneralUtils.getTimestamp(),
    message
  );
  await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Chat.COLLECTION_PATH)
    .doc(chatRoomId)
    .collection(Message.COLLECTION_PATH)
    .add(messageDocument)
}) */

// Creates a chat room
// TODO: make this happen as a single transaction
exports.createChatRoom = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }
  const gameId = data.gameId;
  const ownerId = data.ownerId;
  const chatName = data.chatName;
  const allegianceFilter = data.allegianceFilter

  if (!(typeof gameId === 'string')
        || !(typeof ownerId === 'string')
        || !(typeof chatName === 'string')
        || !(typeof allegianceFilter === 'string')) {
    throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String and not empty.");
  }
  if (gameId.length === 0 || ownerId.length === 0 || chatName.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
            '4 arguments.');
  }
  if (allegianceFilter.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'AllegianceFilter was empty, should be ${Defaults.EMPTY_ALLEGIANCE_FILTER} or race.');
  }

  const settings = Group.createSettings(
    /* addSelf= */ true,
    /* addOthers= */ true,
    /* removeSelf= */ true,
    /* removeOthers= */ true,
    /* autoAdd= */ false,
    /* autoRemove= */ allegianceFilter !== Defaults.EMPTY_ALLEGIANCE_FILTER,
    allegianceFilter);

    await GroupUtils.createGroupAndChat(db, context.auth.uid, gameId, ownerId, chatName, settings);
})

// Creates a chat room
// TODO: make this happen as a single transaction
exports.createOrGetChatWithAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }
  const gameId = data.gameId;
  const playerId = data.playerId;

  if (!(typeof gameId === 'string') || !(typeof playerId === 'string')) {
    throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String and not empty.");
  }
  if (gameId.length === 0 || playerId.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
            '2 arguments.');
  }

  const playerSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .doc(playerId)
    .get()

  const playerData = playerSnapshot.data()
  const gameData = await (await db.collection(Game.COLLECTION_PATH).doc(gameId).get()).data()
  if (playerData === undefined || gameData === undefined) {
    return
  }
  const playerChatRoomIds = Object.keys(playerData[Player.FIELD__CHAT_MEMBERSHIPS])
  const adminPlayerId = gameData[Game.FIELD__FIGUREHEAD_ADMIN_PLAYER_ACCOUNT]

  const adminQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Chat.COLLECTION_PATH)
    .where(admin.firestore.FieldPath.documentId(), "in", Array.from(playerChatRoomIds))
    .where(Chat.FIELD__WITH_ADMINS, "==", true)
    .get()

  if (!adminQuerySnapshot.empty) {
    // Admin chat already exists, reusing the existing chat.
    const adminChatSnapshot = adminQuerySnapshot.docs[0]
    const visibilityField = Player.FIELD__CHAT_MEMBERSHIPS + "." + adminChatSnapshot.id + "." + Player.FIELD__CHAT_VISIBILITY
    await playerSnapshot.ref.update({
      [visibilityField]: true
    })

    // "Add" the admin to the chat. Even if they are already in it, this resets their notification
    // and visibility settings so the chat reappears for them.
    const adminChatData = await adminChatSnapshot.data()
    if (adminChatData === undefined) {
      return adminChatSnapshot.id
    }
    await ChatUtils.addPlayerToChat(db,
                gameId,
                adminPlayerId,
                db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Group.COLLECTION_PATH).doc(adminChatData[Chat.FIELD__GROUP_ID]),
                adminChatSnapshot.id,
                /* isDocRef= */ true)
    return adminChatSnapshot.id
  }

  // Create admin chat since it doesn't exist.
  const chatName = playerData[Player.FIELD__NAME] + " & " + Defaults.FIGUREHEAD_ADMIN_NAME

  const settings = Group.createSettings(
    /* addSelf= */ true,
    /* addOthers= */ false,
    /* removeSelf= */ true,
    /* removeOthers= */ false,
    /* autoAdd= */ false,
    /* autoRemove= */ false,
    Defaults.EMPTY_ALLEGIANCE_FILTER);

  const createdChatId = await GroupUtils.createGroupAndChat(db, context.auth.uid, gameId, playerId, chatName, settings);
  const chatSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Chat.COLLECTION_PATH)
    .doc(createdChatId)
    .get()
  await chatSnapshot.ref.update({
    [Chat.FIELD__WITH_ADMINS]: true
  })

  const createdChatData = await chatSnapshot.data()
  if (createdChatData === undefined) {
    return createdChatId
  }
  await ChatUtils.addPlayerToChat(db,
    gameId,
    adminPlayerId,
    db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Group.COLLECTION_PATH).doc(createdChatData[Chat.FIELD__GROUP_ID]),
    createdChatId,
    /* isDocRef= */ true)
  return createdChatId
})

/**
 * Triggers when a new message is added to a chat room.
 * TODO: send notifications batched instead of one at a time.
 * TODO: for chat with admins if room isn't visible, trigger notification & set room to visible again
 */
exports.triggerChatNotification = functions.firestore
  .document(Game.COLLECTION_PATH + "/{gameId}/" + Chat.COLLECTION_PATH + "/{chatId}/" + Message.COLLECTION_PATH + "/{messageId}")
  .onCreate(async (messageSnapshot, context) => {
      const gameId = context.params.gameId;
      const chatId = context.params.chatId;
      const messageData = await messageSnapshot.data()
      if (messageData === undefined) {
        return
      }
      const senderId = messageData[Message.FIELD__SENDER_ID]

      // Query for all the players in this chat that are allowing notifications.
      const chatMembershipQueryField = Player.FIELD__CHAT_MEMBERSHIPS + "." + chatId + "." + Player.FIELD__CHAT_NOTIFICATIONS
      const playersToNotifyQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
        .doc(gameId)
        .collection(Player.COLLECTION_PATH)
        .where(chatMembershipQueryField, "==", true)
        .get()

      if (playersToNotifyQuerySnapshot.empty) {
        // No one to notify
        return
      }

      // Build notification contents
      const senderData = await (
        await db.collection(Game.COLLECTION_PATH)
          .doc(gameId)
          .collection(Player.COLLECTION_PATH)
          .doc(senderId)
          .get()
      ).data()
      const chatRoomData = await (
        await db.collection(Game.COLLECTION_PATH)
          .doc(gameId)
          .collection(Chat.COLLECTION_PATH)
          .doc(chatId)
          .get()
      ).data()
      if (senderData === undefined || chatRoomData === undefined) {
        return
      }
      const notificationPayload = {
        notification: {
          title: `${senderData[Player.FIELD__NAME]} — ${chatRoomData[Chat.FIELD__NAME]}`,
          body: `${messageData[Message.FIELD__MESSAGE]}`,
        }
      }

      const gameData = await (await db.collection(Game.COLLECTION_PATH)
        .doc(gameId)
        .get())
        .data()
      if (gameData === undefined) {
        return
      }

      const playerIdArray = new Array();
      for (const playerSnapshot of playersToNotifyQuerySnapshot.docs) {
        playerIdArray.push(playerSnapshot.id)
      }

      // Get player device tokens and send notification.
      for (const playerSnapshot of playersToNotifyQuerySnapshot.docs) {
        if (playerSnapshot.id === senderId) {
          // Don't notify the user that sent the message.
          continue
        }
        // If player is the admin player then notify the admin on-call player instead.
        let playerData: any = playerSnapshot.data()
        if (playerSnapshot.id === gameData[Game.FIELD__FIGUREHEAD_ADMIN_PLAYER_ACCOUNT]) {
          if (playerIdArray.includes(gameData[Game.FIELD__ADMIN_ON_CALL_PLAYER_ID])) {
            // Admin on call player is already getting notified about this message.
            continue
          }
          playerData = (await db.collection(Game.COLLECTION_PATH)
            .doc(gameId)
            .collection(Player.COLLECTION_PATH)
            .doc(gameData[Game.FIELD__ADMIN_ON_CALL_PLAYER_ID])
            .get())
            .data()
        }
        if (playerData === undefined) {
          continue
        }
        // Get player's device token to notify
        const userData = await (await db
            .collection(User.COLLECTION_PATH)
            .doc(playerData[Player.FIELD__USER_ID])
            .get()
          ).data()
        if (userData === undefined) {
          continue
        }
        const deviceToken = userData[User.FIELD__DEVICE_TOKEN]
        if (deviceToken.length > 0) {
          // Notify device
          await admin.messaging().sendToDevice(deviceToken, notificationPayload)
        }
      }
});

/*******************************************************
* MISSION functions
********************************************************/

exports.createMission = functions.https.onCall(async (data, context) => {
if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }
  const gameId = data.gameId;
  const missionName = data.name;
  const startTime = data.startTime;
  const endTime = data.endTime;
  const details = data.details;
  const allegianceFilter = data.allegianceFilter

  if (!(typeof gameId === 'string')
        || !(typeof missionName === 'string')
        || !(typeof details === 'string')
        || !(typeof allegianceFilter === 'string')) {
    throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }

  if (!(typeof startTime === 'number') || !(typeof endTime === 'number')) {
      throw new functions.https.HttpsError('invalid-argument', "Expected value to be type number.");
  }

  if (gameId.length === 0 || missionName.length === 0 || allegianceFilter.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
            'valid string arguments.');
  }

  const settings = Group.createSettings(
    /* addSelf= */ false,
    /* addOthers= */ false,
    /* removeSelf= */ false,
    /* removeOthers= */ false,
    /* autoAdd= */ true,
    /* autoRemove= */ allegianceFilter !== Defaults.EMPTY_ALLEGIANCE_FILTER,
    allegianceFilter);

    await GroupUtils.createGroupAndMission(
      db,
      gameId,
      settings,
      missionName,
      startTime,
      endTime,
      details,
      allegianceFilter
    )
})

// TODO: run this as a transaction
exports.updateMission = functions.https.onCall(async (data, context) => {
if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }
  const gameId = data.gameId;
  const missionId = data.missionId;
  const missionName = data.name;
  const startTime = data.startTime;
  const endTime = data.endTime;
  const details = data.details;
  const allegianceFilter = data.allegianceFilter

  if (!(typeof gameId === 'string')
        || !(typeof missionId === 'string')
        || !(typeof missionName === 'string')
        || !(typeof details === 'string')
        || !(typeof allegianceFilter === 'string')) {
    throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }

  if (!(typeof startTime === 'number') || !(typeof endTime === 'number')) {
      throw new functions.https.HttpsError('invalid-argument', "Expected value to be type number.");
  }

  if (gameId.length === 0
      || missionId.length === 0
      || missionName.length === 0
      || allegianceFilter.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
            'valid string arguments.');
  }

  const missionRef = db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Mission.COLLECTION_PATH)
    .doc(missionId)

  const missionData = (await missionRef.get()).data()
  if (missionData === undefined) {
    return
  }
  const associatedGroupId = missionData[Mission.FIELD__GROUP_ID]

  await missionRef.update({
    [Mission.FIELD__NAME]: missionName,
    [Mission.FIELD__START_TIME]: startTime,
    [Mission.FIELD__END_TIME]: endTime,
    [Mission.FIELD__DETAILS]: details,
    [Mission.FIELD__ALLEGIANCE_FILTER]: allegianceFilter
  });

  const groupRef = db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Group.COLLECTION_PATH)
      .doc(associatedGroupId);
  // We have to use dot-notation or firebase will overwrite the entire field.
  const allegianceField = Group.FIELD__SETTINGS + "." + Group.FIELD__SETTINGS_ALLEGIANCE_FILTER
  await groupRef.update({
    [Group.FIELD__NAME]: missionName,
    [allegianceField]: allegianceFilter
  })
  await GroupUtils.updateMissionMembership(db, gameId, associatedGroupId)
})

exports.deleteMission = functions.https.onCall(async (data, context) => {
if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }
  const gameId = data.gameId;
  const missionId = data.missionId;

  if (!(typeof gameId === 'string') || !(typeof missionId === 'string')) {
    throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }

  if (gameId.length === 0 || missionId.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
            'valid id arguments.');
  }

  // Delete the mission document recursively
  const missionRef = db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Mission.COLLECTION_PATH)
    .doc(missionId);
  const missionData = (await missionRef.get()).data()
  if (missionData === undefined) {
    return
  }
  const associatedGroupId = missionData[Mission.FIELD__GROUP_ID]
  await missionRef.listCollections().then(async (collections: any) => {
    for (const collection of collections) {
      await deleteCollection(collection)
    }
    await missionRef.delete()
  });

  // Delete the associated group document recursively
  console.log(`Deleting associated group id: ${associatedGroupId}`)
  const groupRef = db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Group.COLLECTION_PATH)
    .doc(associatedGroupId);
  await groupRef.listCollections().then(async (collections: any) => {
    for (const collection of collections) {
      await deleteCollection(collection)
    }
    await groupRef.delete()
  });
})

/*******************************************************
* Util functions
********************************************************/

function trimmedString(rawText: any): string {
  return rawText.trim();
}

// Normalizes the life code to lowercase and replaces spaces with dashes.
function normalizeLifeCode(rawText: any): string {
  let processedCode = rawText.trim()
  processedCode = processedCode.toLowerCase()
  processedCode = processedCode.split(' ').join('-')
  return processedCode
}

async function deleteCollection(collection: any) {
  const collectionRef = db.collection(collection.path)
  await collectionRef.listDocuments().then((docRefs: any) => {
    return db.getAll(...docRefs)
  }).then(async (documentSnapshots: any) => {
    for (const documentSnapshot of documentSnapshots) {
       if (documentSnapshot.exists) {
          console.log(`Found document with data: ${documentSnapshot.id}`);
       } else {
          console.log(`Found missing document: ${documentSnapshot.id}`);
       }
       await deleteDocument(documentSnapshot.ref)
    }
  })
}

async function deleteDocument(documentRef: any) {
  await documentRef.listCollections().then(async (collections: any) => {
        for (const collection of collections) {
          console.log(`Found subcollection with id: ${collection.id}`);
          await deleteCollection(collection)
        }
        // Done deleting all children, can delete this doc now.
        await documentRef.delete()
  })
}

/*******************************************************
* REWARD functions
********************************************************/

exports.generateClaimCodes = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called ' +
          'while authenticated.');
  }

  const gameId = data.gameId;
  const rewardId = data.rewardId;
  const numCodes = data.numCodes;

  if (!(typeof gameId === 'string') || !(typeof rewardId === 'string')) {
      throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }
  if (!(typeof numCodes === 'number')) {
        throw new functions.https.HttpsError('invalid-argument', "Expected value to be type Number.");
    }
  if (gameId.length === 0 || rewardId.length === 0 || numCodes < 0) {
      throw new functions.https.HttpsError('invalid-argument', 'The function must be called with ' +
          'a valid gameId and rewardId and numCodes.');
  }

  const rewardDocSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Reward.COLLECTION_PATH)
    .doc(rewardId)
    .get()

  const rewardData = await rewardDocSnapshot.data()
  if (rewardData === undefined) {
    return
  }

  // Get existing claim codes
  const claimCodeQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Reward.COLLECTION_PATH)
    .doc(rewardId)
    .collection(ClaimCode.COLLECTION_PATH)
    .get();

  const existingCodeArray = new Array();
  if (!claimCodeQuerySnapshot.empty) {
    claimCodeQuerySnapshot.forEach((claimCodeDoc: any) => {
      existingCodeArray.push(claimCodeDoc.id)
    });
  }

  const generatedCodes: string[] = RewardUtils.generateClaimCode(
    db,
    gameId,
    rewardData,
    existingCodeArray,
    numCodes)

  for (let i = 0; i < numCodes; i++) {
    // Create a new Claim Code document for each code we just generated.
    const claimCode = ClaimCode.create(generatedCodes[i])
    await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Reward.COLLECTION_PATH)
      .doc(rewardId)
      .collection(ClaimCode.COLLECTION_PATH)
      .add(claimCode)
  }
  console.log("Generated " + numCodes + " for reward: " + rewardId)
});





