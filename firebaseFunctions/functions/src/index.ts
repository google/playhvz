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
import * as Defaults from './data/defaults';
import * as Player from './data/player';
import * as Universal from './data/universal';
import * as Group from './data/group';
import * as Chat from './data/chat';

admin.initializeApp();
const db = admin.firestore();

/*******************************************************
* USER functions
********************************************************/

const USER_COLLECTION_PATH = "users";

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
  return await db.collection(USER_COLLECTION_PATH).doc(context.auth.uid).set(updatedData);
});



/*******************************************************
* GAME functions
********************************************************/

const GAME_COLLECTION_PATH = "games";
const GAME_FIELD__NAME = "name";

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

  const gameQuery = await db.collection(GAME_COLLECTION_PATH).where(GAME_FIELD__NAME, "==", name).get();
  if (!gameQuery.empty) {
    throw new functions.https.HttpsError('already-exists', 'A game with the given name already exists');
  }

  const gameData = {
    "name": name,
    "creatorUserId": context.auth.uid,
  }

  const gameId = (await db.collection(GAME_COLLECTION_PATH).add(gameData)).id;
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

  const querySnapshot = await db.collection(GAME_COLLECTION_PATH).where(GAME_FIELD__NAME, "==", name).get();
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

  const gameQuerySnapshot = await db.collection(GAME_COLLECTION_PATH).where(GAME_FIELD__NAME, "==", gameName).get();
  if (gameQuerySnapshot.empty || gameQuerySnapshot.docs.length > 1) {
     throw new functions.https.HttpsError('failed-precondition', 'No game with given name exists.');
  }
  const game = gameQuerySnapshot.docs[0];
  const gameId = game.id;
  const userPlayerQuerySnapshot = await getUsersPlayersQuery(uid, gameId).get();
  if (!userPlayerQuerySnapshot.empty) {
    throw new functions.https.HttpsError('failed-precondition', 'User is already a player in this game.');
  }

  const playerNameQuerySnapshot = await getPlayersWithNameQuery(gameId, playerName).get();
  if (!playerNameQuerySnapshot.empty) {
      throw new functions.https.HttpsError('failed-precondition', 'Player name already taken.');
  }

  const player = Player.create(uid, playerName);
  const playerDocument = (await db.collection(GAME_COLLECTION_PATH).doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .add(player));

  await addNewPlayerToGroups(gameId, playerDocument)
});



/*******************************************************
* PLAYER functions
********************************************************/

// Returns a Query listing all players in the given game that are owned by this user.
function getUsersPlayersQuery(uid: any, gameId: string) {
  return db.collection(GAME_COLLECTION_PATH).doc(gameId).collection(Player.COLLECTION_PATH)
      .where(Universal.FIELD__USER_ID, "==", uid);
}

// Returns a Query listing all players in the given game that have the given name.
function getPlayersWithNameQuery(gameId: string, playerName: string) {
  return db.collection(GAME_COLLECTION_PATH).doc(gameId).collection(Player.COLLECTION_PATH)
      .where(Player.FIELD__NAME, "==", playerName);
}

/*******************************************************
* GROUP functions
********************************************************/

// Creates a group
async function createGlobalGroup(uid: any, gameId: string) {
  const group = Group.create(
    /* name= */ Defaults.globalChatName,
    /* managed= */ true,
    /* settings= */ Group.getGlobalGroupSettings(),
  )
  const createdGroup = await db.collection(GAME_COLLECTION_PATH).doc(gameId).collection(Group.COLLECTION_PATH).add(group);
  const chat = Chat.create(createdGroup.id, Defaults.globalChatName)
  await db.collection(GAME_COLLECTION_PATH).doc(gameId).collection(Chat.COLLECTION_PATH).add(chat)
}

// Add player to global chatroom
async function addNewPlayerToGroups(gameId: string, player: any) {
  const groupQuery = await db.collection(GAME_COLLECTION_PATH).doc(gameId).collection(Group.COLLECTION_PATH)
  .where(Group.FIELD__MANAGED, "==", true)
  .where(Group.FIELD__NAME, "==", Defaults.globalChatName).get()

  if (groupQuery.empty || groupQuery.docs.length > 1) {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot find global chat.');
  }
  const group = groupQuery.docs[0];
  const chatQuery = await db.collection(GAME_COLLECTION_PATH).doc(gameId).collection(Chat.COLLECTION_PATH)
    .where(Chat.FIELD__GROUP_ID, "==", group.id).get()
  if (chatQuery.empty || chatQuery.docs.length > 1) {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot find chatroom associated with group.');
  }

  const chatId = chatQuery.docs[0].id;
  const chatVisibility = {[Player.FIELD__CHAT_VISIBILITY]: true}
  const membership = {[chatId]: chatVisibility}
  await group.ref.update({
      [Group.FIELD__MEMBERS]: admin.firestore.FieldValue.arrayUnion(player.id)
  });
  await player.update({[Player.FIELD__CHAT_MEMBERSHIPS]: membership})
}

/*******************************************************
* Util functions
********************************************************/

function trimmedString(rawText: any): string {
  return rawText.trim();
}










