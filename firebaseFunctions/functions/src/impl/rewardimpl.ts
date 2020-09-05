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
//import * as functions from 'firebase-functions';

import * as Game from '../data/game';
import * as Reward from '../data/reward';

/**
 * Function to get all the rewards in the given game id.
 *
 * @returns A JSON list of *reward short names*
 */
export async function getRewardsByName (db: any, gameId: string): Promise<{"rewards": string}> {
  const allRewardsQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Reward.COLLECTION_PATH)
    .get()
  if (allRewardsQuerySnapshot.empty) {
    // Game has no rewards, return empty map.
    return { "rewards": JSON.stringify([...new Map()]) }
  }
  const rewardMap = new Map();
  allRewardsQuerySnapshot.forEach((rewardDoc: any) => {
    const rewardData = rewardDoc.data()
    if (rewardData === undefined) {
      return // "continue" in a forEach
    }
    rewardMap.set(rewardData[Reward.FIELD__SHORT_NAME], rewardDoc.id)
  });
  return { "rewards": JSON.stringify([...rewardMap]) }
}