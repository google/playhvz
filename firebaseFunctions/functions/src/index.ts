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

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as Chat from './data/chat';
import * as ChatUtils from './utils/chatutils';
import * as Defaults from './data/defaults';
import * as Game from './data/game';
import * as Group from './data/group';
import * as Player from './data/player';
import * as PlayerUtils from './utils/playerutils';
import * as Message from './data/message';
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
    "name": name,
    "creatorUserId": context.auth.uid,
  }

  const gameId = (await db.collection(Game.COLLECTION_PATH).add(gameData)).id;
  await createGlobalGroup(context.auth.uid, gameId);
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
  const playerDocument = (await db.collection(Game.COLLECTION_PATH).doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .add(player));

  await addNewPlayerToGroups(gameId, playerDocument)
});



/*******************************************************
* PLAYER functions
********************************************************/


/*******************************************************
* GROUP functions
********************************************************/

// Creates a group
async function createGlobalGroup(uid: any, gameId: string) {
  const group = Group.createManagedGroup(
    /* name= */ Defaults.globalChatName,
    /* settings= */ Group.getGlobalGroupSettings(),
  )
  const createdGroup = await db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Group.COLLECTION_PATH).add(group);
  const chat = Chat.create(createdGroup.id, Defaults.globalChatName)
  await db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Chat.COLLECTION_PATH).add(chat)
}

// Add player to global chatroom
async function addNewPlayerToGroups(gameId: string, player: any) {
  const groupQuery = await db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Group.COLLECTION_PATH)
  .where(Group.FIELD__MANAGED, "==", true)
  .where(Group.FIELD__NAME, "==", Defaults.globalChatName).get()

  if (groupQuery.empty || groupQuery.docs.length > 1) {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot find global chat.');
  }
  const group = groupQuery.docs[0];
  const chatQuery = await db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Chat.COLLECTION_PATH)
    .where(Chat.FIELD__GROUP_ID, "==", group.id).get()
  if (chatQuery.empty || chatQuery.docs.length > 1) {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot find chatroom associated with group.');
  }

  await group.ref.update({
      [Group.FIELD__MEMBERS]: admin.firestore.FieldValue.arrayUnion(player.id)
  });

  const chatId = chatQuery.docs[0].id;
  const chatVisibility = {[Player.FIELD__CHAT_VISIBILITY]: true}
  // We have to use dot-notation or firebase will overwrite the entire field.
  const membershipField = Player.FIELD__CHAT_MEMBERSHIPS + "." + chatId
  await player.update({
    [membershipField]: chatVisibility
  })
}

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

  const group = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Group.COLLECTION_PATH)
    .doc(groupId)
    .get();

  for (let playerId of playerIdList) {
    await ChatUtils.addPlayerToChat(db, gameId, playerId, group, chatRoomId, /* isNewGroup= */ false)
  }
});

// Creates a group
async function createGroupAndChat(uid: any, gameId: string, playerId: string, chatName: string, settings: any) {
  const group = Group.createPlayerOwnedGroup(
    playerId,
    chatName,
    /* settings= */ settings,
  )
  const createdGroup = await db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Group.COLLECTION_PATH).add(group);
  const chat = Chat.create(createdGroup.id, chatName)
  const createdChat = await db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Chat.COLLECTION_PATH).add(chat)
  await ChatUtils.addPlayerToChat(db, gameId, playerId, createdGroup, createdChat.id, /* isNewGroup= */ true)
}

/*******************************************************
* CHAT functions
********************************************************/

// Sends a chat message
// TODO: make this happen as a single transaction
exports.sendChatMessage = functions.https.onCall(async (data, context) => {
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
    getTimestamp(),
    message
  );
  await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Chat.COLLECTION_PATH)
    .doc(chatRoomId)
    .collection(Message.COLLECTION_PATH)
    .add(messageDocument)
})

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
      throw new functions.https.HttpsError('invalid-argument', 'AllegianceFilter was empty, should be ${EMPTY_ALLEGIANCE_FILTER} or race.');
  }

  const settings = Group.createSettings(
    /* addSelf= */ true,
    /* addOthers= */ true,
    /* removeSelf= */ true,
    /* removeOthers= */ false,
    /* autoAdd= */ false,
    /* autoRemove= */ allegianceFilter != Group.EMPTY_ALLEGIANCE_FILTER,
    allegianceFilter);

    await createGroupAndChat(context.auth.uid, gameId, ownerId, chatName, settings);
})

/*******************************************************
* Util functions
********************************************************/

function trimmedString(rawText: any): string {
  return rawText.trim();
}

function getTimestamp(): any {
  return admin.firestore.Timestamp.now()
}










