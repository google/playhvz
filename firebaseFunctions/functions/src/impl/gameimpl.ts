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

import * as Defaults from '../data/defaults';
import * as Game from '../data/game';
import * as GeneralUtils from '../utils/generalutils';
import * as Group from '../data/group';
import * as GroupUtils from '../utils/grouputils';
import * as Player from '../data/player';
import * as PlayerUtils from '../utils/playerutils';
import * as RewardUtils from '../utils/rewardutils';

/**
 * Function to create a new game and all the internals required.
 */
export async function createGame(
  db: any,
  uid: string,
  gameName: string,
  startTime: number,
  endTime: number
): Promise<string> {
  const gameQuery = await db.collection(Game.COLLECTION_PATH).where(Game.FIELD__NAME, "==", name).get();
  if (!gameQuery.empty) {
    throw new functions.https.HttpsError('already-exists', 'A game with the given name already exists');
  }
  const gameData = Game.create(uid, gameName, startTime, endTime)
  const gameRef = await db.collection(Game.COLLECTION_PATH).add(gameData)
  const gameId = gameRef.id

  // Create managed properties
  await GroupUtils.createManagedGroups(db, gameId);
  await RewardUtils.createManagedRewards(db, gameId)

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
  const figureheadPlayerData = Player.create("", Defaults.FIGUREHEAD_ADMIN_NAME);
  const figureheadPlayerRef = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Player.COLLECTION_PATH)
      .add(figureheadPlayerData);

  await GroupUtils.addPlayerToManagedGroups(db, gameId, figureheadPlayerRef, /* ignoreAllegiance= */ true)
  await gameRef.update({
    [Game.FIELD__FIGUREHEAD_ADMIN_PLAYER_ACCOUNT]: figureheadPlayerRef.id
  })
  return gameId;
}

/**
 * Function to update the update-able fields of a game.
 */
export async function updateGame(
  db: any,
  gameId: string,
  adminOnCallPlayerId: string,
  startTime: number,
  endTime: number
) {
  const gameRef = db.collection(Game.COLLECTION_PATH).doc(gameId);
  await gameRef.update({
      [Game.FIELD__ADMIN_ON_CALL_PLAYER_ID]: adminOnCallPlayerId,
      [Game.FIELD__START_TIME]: startTime,
      [Game.FIELD__END_TIME]: endTime
    });
}


/**
 * Function that throws an error if a game with the given name doesn't exist.
 *
 * @returns The game's id, assuming it exists.
 */
export async function checkGameExists(
  db: any,
  gameName: string
): Promise<string> {
  const querySnapshot = await db.collection(Game.COLLECTION_PATH)
    .where(Game.FIELD__NAME, "==", gameName)
    .get();
  if (querySnapshot.empty || querySnapshot.docs.length > 1) {
    throw new functions.https.HttpsError('failed-precondition', 'No game with given name exists.');
  }
  return querySnapshot.docs[0].id
}

/**
 * Function that adds a player to a game.
 *
 * @returns The game's id, assuming it exists.
 */
export async function joinGame(
  db: any,
  uid: string,
  gameName: string,
  playerName: string
): Promise<string> {
  const gameId = await checkGameExists(db, gameName)
  const userPlayerQuerySnapshot = await PlayerUtils.getUsersPlayersQuery(db, uid, gameId).get();
  if (!userPlayerQuerySnapshot.empty) {
    throw new functions.https.HttpsError('failed-precondition', 'User is already a player in this game.');
  }

  const playerNameQuerySnapshot = await PlayerUtils.getPlayersWithNameQuery(db, gameId, playerName).get();
  if (!playerNameQuerySnapshot.empty) {
      throw new functions.https.HttpsError('failed-precondition', 'Player name already taken.');
  }

  const playerData = Player.create(uid, playerName);
  const playerDocRef = (await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .add(playerData));

  await GroupUtils.addPlayerToManagedGroups(db, gameId, playerDocRef, /* ignoreAllegiance= */ false)
  return gameId
}

/**
 * Initiate a recursive delete of the game, deleting all documents at a given path.
 *
 * The calling user must be authenticated and have the custom "admin" attribute
 * set to true on the auth token.
 *
 * This delete is NOT an atomic operation and it's possible
 * that it may fail after only deleting some documents.
 *
 * @param {string} data.path the document or collection path to delete.
 */
export async function deleteGame(
   db: any,
   uid: string,
   gameId: string
) {
    console.log(`User ${uid} has requested to delete game ${gameId}`);
    // Run a recursive delete on the game document path.
    const gameRef = db.collection(Game.COLLECTION_PATH).doc(gameId);
    await gameRef.listCollections().then(async (collections: any) => {
      for (const collection of collections) {
        await GeneralUtils.deleteCollection(db, collection)
      }
      await gameRef.delete()
    });
}