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

import * as ClaimCode from '../data/claimcode';
import * as Defaults from '../data/defaults';
import * as Game from '../data/game';
import * as Player from '../data/player';
import * as Reward from '../data/reward';
import * as RewardUtils from '../utils/rewardutils';


/**
 * Function to claim a reward code.
 */
export async function redeemRewardCode (
  db: any,
  gameId: string,
  playerId: string,
  claimCode: string
) {
  // Check if claim code is associated with valid reward.
  const shortName = RewardUtils.extractShortNameFromCode(claimCode)
  const rewardQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Reward.COLLECTION_PATH)
    .where(Reward.FIELD__SHORT_NAME, "==", shortName)
    .get()
  if (rewardQuerySnapshot.empty || rewardQuerySnapshot.docs.length > 1) {
     throw new functions.https.HttpsError('failed-precondition', 'No valid reward exists.');
  }
  const rewardDocSnapshot = rewardQuerySnapshot.docs[0];

  // If the middle code matches the player id then this is a reward we're granting them. Let it be so.
  const secondCode = RewardUtils.extractPlayerIdFromCode(claimCode)
  if (secondCode === playerId.toLowerCase()) {
    await db.collection(Game.COLLECTION_PATH)
          .doc(gameId)
          .collection(Reward.COLLECTION_PATH)
          .doc(rewardDocSnapshot.id)
          .collection(ClaimCode.COLLECTION_PATH)
          .add(ClaimCode.create(claimCode))
  }

  // Check if reward code is valid.
  const claimCodeQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Reward.COLLECTION_PATH)
      .doc(rewardDocSnapshot.id)
      .collection(ClaimCode.COLLECTION_PATH)
      .where(ClaimCode.FIELD__CODE, "==", claimCode)
      .where(ClaimCode.FIELD__REDEEMER, "==", Defaults.EMPTY_REWARD_REDEEMER)
      .get()
  if (claimCodeQuerySnapshot.empty || claimCodeQuerySnapshot.docs.length > 1) {
    throw new functions.https.HttpsError('failed-precondition', 'No valid claim code exists.');
  }
  const claimCodeDocSnapshot = claimCodeQuerySnapshot.docs[0];

  const playerDocRef = db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .doc(playerId)
  const rewardData = rewardDocSnapshot.data()
  if (rewardData == undefined) {
        return
  }
  const rewardInfoPath = Player.FIELD__REWARDS + "." + rewardDocSnapshot.id

  // Redeem claim code!
  await claimCodeDocSnapshot.ref.update({
    [ClaimCode.FIELD__REDEEMER]: playerId
  })
  await playerDocRef.update({
    [rewardInfoPath]: admin.firestore.FieldValue.increment(1),
    [Player.FIELD__POINTS]: admin.firestore.FieldValue.increment(rewardData.points)
  })
}


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