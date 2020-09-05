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
 * Function to create a new reward.
 */
export async function createReward(
  db: any,
  gameId: string,
  shortName: string,
  longName: string,
  description: string,
  imageUrl: string,
  points: number
) {
  // Verify shortName isn't already used.
  const rewardQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Reward.COLLECTION_PATH)
    .where(Reward.FIELD__SHORT_NAME, "==", shortName)
    .get()
  if (!rewardQuerySnapshot.empty) {
    throw new functions.https.HttpsError('failed-precondition', 'Reward with that name already exists.');
  }
  const reward = Reward.create(shortName, longName, description, imageUrl, points)
  await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Reward.COLLECTION_PATH)
    .add(reward)
}


/**
 * Function to update the fields of a given reward.
 */
export async function updateReward(
  db: any,
  gameId: string,
  rewardId: string,
  longName: string,
  description: string,
  imageUrl: string,
  points: number
) {
  const rewardDocSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Reward.COLLECTION_PATH)
    .doc(rewardId)
    .get()
  const rewardData = rewardDocSnapshot.data()
  if (rewardData === undefined) {
    return
  }
  const oldPointValue = rewardData.points
  await rewardDocSnapshot.ref.update({
      [Reward.FIELD__LONG_NAME]: longName,
      [Reward.FIELD__DESCRIPTION]: description,
      [Reward.FIELD__IMAGE_URL]: imageUrl,
      [Reward.FIELD__POINTS]: points
    })

  // If point value was updated, recalculate player points
  if (oldPointValue === points) {
      return
  }
  const pointDiff = points - oldPointValue
  const usedCodesQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Reward.COLLECTION_PATH)
    .doc(rewardId)
    .collection(ClaimCode.COLLECTION_PATH)
    .where(ClaimCode.FIELD__REDEEMER, ">", Defaults.EMPTY_REWARD_REDEEMER)
    .get();
  usedCodesQuerySnapshot.forEach(async (claimCodeDoc: any) => {
    const claimData = claimCodeDoc.data()
    if (claimData === undefined) {
      return // "continue" in a forEach
    }
    const playerId = claimData[ClaimCode.FIELD__REDEEMER]
    const playerDocRef = db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Player.COLLECTION_PATH)
      .doc(playerId)
    await playerDocRef.update({
      [Player.FIELD__POINTS]: admin.firestore.FieldValue.increment(pointDiff)
    })
  });
}


/**
 * Function to generate claim codes for a given reward.
 */
export async function generateClaimCodes(
  db: any,
  gameId: string,
  rewardId: string,
  numCodes: number
) {
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
    numCodes
  )
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
}


/**
 * Function to calculate the number of claimed & unclaimed reward codes.
 *
 * @returns A JSON with unused count and used count
 */
export async function getRewardClaimedStats(db: any, gameId: string, rewardId: string): Promise<{"unusedCount": string, "usedCount": string}> {
  // Get unused claim codes
  const unusedCodesQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Reward.COLLECTION_PATH)
    .doc(rewardId)
    .collection(ClaimCode.COLLECTION_PATH)
    .where(ClaimCode.FIELD__REDEEMER, "==", Defaults.EMPTY_REWARD_REDEEMER)
    .get();

  // Get used claim codes
  const usedCodesQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Reward.COLLECTION_PATH)
    .doc(rewardId)
    .collection(ClaimCode.COLLECTION_PATH)
    .where(ClaimCode.FIELD__REDEEMER, ">", Defaults.EMPTY_REWARD_REDEEMER)
    .get();

  const unusedCount = unusedCodesQuerySnapshot.empty ? 0 : unusedCodesQuerySnapshot.docs.length
  const usedCount = usedCodesQuerySnapshot.empty ? 0 : usedCodesQuerySnapshot.docs.length
  return {
    "unusedCount": unusedCount,
    "usedCount": usedCount
  }
}


/**
 * Function to show all available claim codes for a given reward.
 *
 * @returns A JSON list of claim codes
 */
export async function getAvailableClaimCodes(db: any, gameId: string, rewardId: string): Promise<{"claimCodes": string}> {
  // Get unused claim codes
  const unusedCodesQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Reward.COLLECTION_PATH)
    .doc(rewardId)
    .collection(ClaimCode.COLLECTION_PATH)
    .where(ClaimCode.FIELD__REDEEMER, "==", Defaults.EMPTY_REWARD_REDEEMER)
    .get();

  if (unusedCodesQuerySnapshot.empty) {
    return {
        "claimCodes": JSON.stringify([])
      }
  }

  const codeArray = new Array();
  unusedCodesQuerySnapshot.forEach((claimCodeDoc: any) => {
    const claimData = claimCodeDoc.data()
    if (claimData === undefined) {
      return // "continue" in a forEach
    }
    codeArray.push(claimData[ClaimCode.FIELD__CODE])
  });

  return {
    "claimCodes": JSON.stringify(codeArray)
  }
}


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
    [ClaimCode.FIELD__REDEEMER]: playerId,
    [ClaimCode.FIELD__TIMESTAMP]: Date.now()
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