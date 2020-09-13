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
import * as RandomWords from '../data/wordlist';
import * as Reward from '../data/reward';
import * as RewardImpl from '../impl/rewardimpl';

const NUM_REWARD_CODE_WORDS = 2

export function extractShortNameFromCode(claimCode: string): string {
  return claimCode.split("-", 1)[0]
}

export function extractPlayerIdFromCode(claimCode: string): string {
  return claimCode.split("-", 2)[1]
}

export function generateClaimCode(
  db: any,
  gameId: string,
  rewardData: any,
  existingCodeArray: Array<string>,
  numCodesWanted: number
): string[] {
  let rewardShortName = rewardData[Reward.FIELD__SHORT_NAME]
  rewardShortName = rewardShortName.trim()
  rewardShortName = rewardShortName.replace(/\W/g, '') // remove all non alphanumeric chars

  const seed = gameId + rewardShortName + existingCodeArray.length
  const numWordsToGenerate = numCodesWanted * NUM_REWARD_CODE_WORDS + numCodesWanted

  const selectedWords = getRandomWords(seed, numWordsToGenerate)

  const generatedCodes = new Array(numCodesWanted)
  for (let i = 0; i < numCodesWanted; i++) {
    const currentCode: string[] = new Array(1 + NUM_REWARD_CODE_WORDS)
    currentCode[0] = rewardShortName
    currentCode[1] = selectedWords[i * NUM_REWARD_CODE_WORDS]
    currentCode[2] = selectedWords[(i * NUM_REWARD_CODE_WORDS) + 1]
    let codeProposal = currentCode.join("-")
    if (existingCodeArray.includes(codeProposal) || generatedCodes.includes(codeProposal)) {
      // This code is already generated... let's mix it up a bit and add an extra word
      codeProposal = codeProposal + "-" + selectedWords[(numCodesWanted * NUM_REWARD_CODE_WORDS) + i]
    }
    generatedCodes[i] = codeProposal
  }
  return generatedCodes
}

// Creates rewards that are managed and should exist for every game.
export async function createManagedRewards(db: any, gameId: string) {
  const infectRewardData = Reward.createManagedReward(
    Defaults.INFECT_REWARD_SHORT_NAME,
    Defaults.INFECT_REWARD_LONG_NAME,
    Defaults.INFECT_REWARD_DESCRIPTION,
    Defaults.INFECT_REWARD_IMAGE_URL,
    Defaults.INFECT_REWARD_POINTS
  )
  const declareRewardData = Reward.createManagedReward(
    Defaults.DECLARE_REWARD_SHORT_NAME,
    Defaults.DECLARE_REWARD_LONG_NAME,
    Defaults.DECLARE_REWARD_DESCRIPTION,
    Defaults.DECLARE_REWARD_IMAGE_URL,
    Defaults.DECLARE_REWARD_POINTS
  )
  const infectRewardSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Reward.COLLECTION_PATH)
    .add(infectRewardData);
  await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Reward.COLLECTION_PATH)
      .add(declareRewardData);
  await db.collection(Game.COLLECTION_PATH).doc(gameId).update({
    [Game.FIELD__INFECT_REWARD_ID]: infectRewardSnapshot.id
  })
}

export async function giveRewardForInfecting(
  db: any,
  gameId: string,
  infectorId: string
) {
  let infectRewardCode = generateInfectClaimCode(infectorId)
  infectRewardCode = GeneralUtils.normalizeLifeCode(infectRewardCode)
  await RewardImpl.redeemRewardCode(db, gameId, infectorId, infectRewardCode)
}

function getRandomWords(seed: string, numWords: number): string[] {
  const selectedWords: string[] = new Array(numWords)
  for (let i = 0; i < numWords; i++) {
    const rand = GeneralUtils.hashString("herp-" + i + "-derp-" + seed)
    selectedWords[i] = RandomWords.WORD_ARRAY[GeneralUtils.mod(rand, RandomWords.WORD_ARRAY.length)].trim()
  }
  return selectedWords
}

function generateInfectClaimCode(playerId: string): string {
  return Defaults.INFECT_REWARD_SHORT_NAME + "-" + playerId + "-" + Date.now()
}
