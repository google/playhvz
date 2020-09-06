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

import * as ClaimCode from '../data/claimcode';
import * as Defaults from '../data/defaults';
import * as Game from '../data/game';
import * as Player from '../data/player';
import * as Reward from '../data/reward';
import * as Stat from '../data/stat';

export async function invalidateGameStats(
  db: any,
  gameId: string
) {
  const gameData = (await db.collection(Game.COLLECTION_PATH).doc(gameId).get()).data()
  if (gameData === undefined) {
    return
  }
  const statId = gameData[Game.FIELD__STAT_ID]
  const statSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Stat.COLLECTION_PATH)
    .doc(statId)
    .get()
  const statData = statSnapshot.data()
  if (statData === undefined) {
    return
  }
  if (!statData[Stat.FIELD__IS_OUT_OF_DATE]) {
    await statSnapshot.ref.update({
      [Stat.FIELD__IS_OUT_OF_DATE]: true
    })
  }
}

export async function createGameStats(
  db: any,
  gameId: string,
  gameData: any
): Promise<{ [key: string]: any; }> {
    const currentHumanCount = await getCurrentHumanCount(db, gameId)
    const currentZombieCount = await getCurrentZombieCount(db, gameId)
    const infectRewardId = gameData[Game.FIELD__INFECT_REWARD_ID]
    const starterZombieCount = await getStarterZombieCount(db, gameId, infectRewardId, currentZombieCount)
    // Bucket infections based on time of infection.
    const gameStartTime = gameData[Game.FIELD__START_TIME]
    const gameEndTime = gameData[Game.FIELD__END_TIME]
    // TODO: Add error checking that start time is always < end time
    const interval = (gameEndTime - gameStartTime) / Defaults.GAME_STATS_DIVIDEND
    const statsOverTimeArray = new Array();
    for (let i = gameStartTime; i <= gameEndTime; i += interval) {
      const timing = await getIntervalInfectionCount(db, gameId, infectRewardId, i)
      statsOverTimeArray.push(timing)
    }
    const newStatData = Stat.create(
      currentHumanCount,
      currentZombieCount,
      starterZombieCount,
      statsOverTimeArray
    )
    const statSnapshot = await db.collection(Game.COLLECTION_PATH)
          .doc(gameId)
          .collection(Stat.COLLECTION_PATH)
          .add(newStatData)
    await db.collection(Game.COLLECTION_PATH).doc(gameId).update({
      [Game.FIELD__STAT_ID]: statSnapshot.id
    })
    return newStatData
}

export async function updateGameStats(
  db: any,
  gameId: string,
  gameData: any
): Promise<{ [key: string]: any; }> {
    const currentHumanCount = await getCurrentHumanCount(db, gameId)
    const currentZombieCount = await getCurrentZombieCount(db, gameId)
    const infectRewardId = gameData[Game.FIELD__INFECT_REWARD_ID]
    const starterZombieCount = await getStarterZombieCount(db, gameId, infectRewardId, currentZombieCount)
    // Bucket infections based on time of infection.
    const gameStartTime = gameData[Game.FIELD__START_TIME]
    const gameEndTime = gameData[Game.FIELD__END_TIME]
    // TODO: Add error checking that start time is always < end time
    const interval = (gameEndTime - gameStartTime) / Defaults.GAME_STATS_DIVIDEND
    const statsOverTimeArray = new Array();
    for (let i = gameStartTime; i <= gameEndTime; i += interval) {
      const timing = await getIntervalInfectionCount(db, gameId, infectRewardId, i)
      statsOverTimeArray.push(timing)
    }
    const statRef = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Stat.COLLECTION_PATH)
      .doc(gameData[Game.FIELD__STAT_ID])
    statRef.update({
        [Stat.FIELD__CURRENT_HUMAN_COUNT]: currentHumanCount,
        [Stat.FIELD__CURRENT_ZOMBIE_COUNT]: currentZombieCount,
        [Stat.FIELD__STARTER_ZOMBIE_COUNT]: starterZombieCount,
        [Stat.FIELD__IS_OUT_OF_DATE]: false,
        [Stat.FIELD__STATS_OVER_TIME]: statsOverTimeArray
    })
    const updatedData = (await statRef.get()).data()
    if (updatedData === undefined) {
      throw new functions.https.HttpsError('failed-precondition', 'Error getting updated game stats.');
    } else {
      return Stat.formattedForReturn(updatedData)
    }
}

async function getCurrentHumanCount(
  db: any,
  gameId: string
): Promise<number> {
    const humanQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Player.COLLECTION_PATH)
      .where(Player.FIELD__ALLEGIANCE, "==", Defaults.HUMAN_ALLEGIANCE_FILTER)
      .get();
    if (humanQuerySnapshot.empty) {
      return Defaults.GAME_STATS_NO_DATA
    } else {
      return humanQuerySnapshot.docs.length
    }
}

async function getCurrentZombieCount(
  db: any,
  gameId: string
): Promise<number> {
    const zombieQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Player.COLLECTION_PATH)
      .where(Player.FIELD__ALLEGIANCE, "==", Defaults.ZOMBIE_ALLEGIANCE_FILTER)
      .get();
    if (zombieQuerySnapshot.empty) {
      return Defaults.GAME_STATS_NO_DATA
    } else {
      return zombieQuerySnapshot.docs.length
    }
}

async function getStarterZombieCount(
  db: any,
  gameId: string,
  infectRewardId: string,
  currentZombieCount: number
): Promise<number> {
    const infectionQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Reward.COLLECTION_PATH)
      .doc(infectRewardId)
      .collection(ClaimCode.COLLECTION_PATH)
      .get();
    if (infectionQuerySnapshot.empty) {
      return Defaults.GAME_STATS_NO_DATA
    } else {
      return currentZombieCount - infectionQuerySnapshot.docs.length
    }
}

async function getIntervalInfectionCount(
  db: any,
  gameId: string,
  infectRewardId: string,
  interval: number
): Promise<{ [key: string]: any; }> {
    const infectionQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Reward.COLLECTION_PATH)
      .doc(infectRewardId)
      .collection(ClaimCode.COLLECTION_PATH)
      .where(ClaimCode.FIELD__TIMESTAMP, "<", interval)
      .get();
    let intervalInfectionCount = Defaults.GAME_STATS_NO_DATA
    if (infectionQuerySnapshot.empty) {
      intervalInfectionCount = Defaults.GAME_STATS_NO_DATA
    } else {
      intervalInfectionCount = infectionQuerySnapshot.docs.length
    }
    return Stat.createStatOverTime(interval, intervalInfectionCount)
}
