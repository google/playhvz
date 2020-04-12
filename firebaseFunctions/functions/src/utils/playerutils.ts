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
import * as Defaults from '../data/defaults';
import * as Game from '../data/game';
import * as GeneralUtils from '../utils/generalutils';
import * as GroupUtils from '../utils/grouputils';
import * as Player from '../data/player';
import * as PlayerUtils from '../utils/playerutils';
import * as RandomWords from '../data/wordlist';
import * as Universal from '../data/universal';

const NUM_LIFE_CODE_WORDS = 3

// Returns a Query listing all players in the given game that are owned by this user.
export function getUsersPlayersQuery(db: any, uid: any, gameId: string) {
  return db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Player.COLLECTION_PATH)
      .where(Universal.FIELD__USER_ID, "==", uid);
}

// Returns a Query listing all players in the given game that have the given name.
export function getPlayersWithNameQuery(db: any, gameId: string, playerName: string) {
  return db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Player.COLLECTION_PATH)
      .where(Player.FIELD__NAME, "==", playerName);
}

export async function generateLifeCode(db: any, gameId: string, playerSnapshot: any) {
  const gameSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .get()

  const gameData = await gameSnapshot.data()
  const playerData = await playerSnapshot.data()
  if (gameData === undefined || playerData === undefined) {
    return
  }

  const gameName = gameData[Game.FIELD__NAME]
  const playerName = playerData[Player.FIELD__NAME]

  let numLives = 0
  if (playerData[Player.FIELD__LIVES] !== undefined) {
    numLives = Object.keys(playerData[Player.FIELD__LIVES]).length
  }

  const seed = gameName + playerName + numLives
  const selectedWords = getRandomWords(seed, NUM_LIFE_CODE_WORDS)
  const lifeCode = selectedWords.join("-")

  // We have to use dot-notation or firebase will overwrite the entire field.
  const lifeCodeField = Player.FIELD__LIVES + "." + lifeCode
  const lifeData = {
    [Player.FIELD__LIFE_CODE_STATUS]: false,
    [Player.FIELD__LIFE_CODE_TIMESTAMP]: GeneralUtils.getTimestamp()
  }
  await playerSnapshot.ref.update({
    [lifeCodeField]: lifeData
  })
}

export async function internallyChangePlayerAllegiance(db: any, gameId: string, playerId: string, newAllegiance: string) {
  const playerDocSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .doc(playerId)
    .get()
  const playerData = playerDocSnapshot.data()
  if (playerData === undefined) {
    console.log("Player data is undefined, not updating allegiance")
    return
  }
  if (playerData[Player.FIELD__ALLEGIANCE] === newAllegiance) {
    console.log("Not changing allegiance, it's already set to " + newAllegiance)
    return
  }
  if (newAllegiance === Defaults.HUMAN_ALLEGIANCE_FILTER) {
    await PlayerUtils.generateLifeCode(db, gameId, playerDocSnapshot)
  }

  // Update player allegiance
  await playerDocSnapshot.ref.update({
    [Player.FIELD__ALLEGIANCE]: newAllegiance
  })

  await GroupUtils.updatePlayerMembershipInGroups(db, gameId, playerDocSnapshot.ref)
}


function getRandomWords(seed: string, numWords: number): string[] {
  const selectedWords: string[] = new Array(numWords)
  for (let i = 0; i < numWords; i++) {
    const rand = GeneralUtils.hashString("herp-" + i + "-derp-" + seed)
    selectedWords[i] = RandomWords.WORD_ARRAY[rand % RandomWords.WORD_ARRAY.length].trim()
  }
  return selectedWords
}