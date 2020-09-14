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

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
import * as TestEnv from './testsetup';
import * as GeneralUtils from '../src/utils/generalutils';
chai.use(chaiAsPromised);
const assert = chai.assert;
const expect = chai.expect

const db = TestEnv.db;
const playHvzFunctions = TestEnv.playHvzFunctions;
const FAKE_UID = TestEnv.FAKE_UID
const FAKE_GAME_ID = "gameId"
const FAKE_GAME_NAME = "gameName"
const FAKE_START_TIME = 0
const FAKE_END_TIME = 5

describe('Game Collection Tests', () => {
    after(async () => {
        TestEnv.after();
    });


    it('createGame creates game object', async () => {
        // Verify current state
        const gameQuery = db.collection("games").where("name", "==", FAKE_GAME_NAME)
        let querySnapshot = await gameQuery.get()
        assert.equal(querySnapshot.empty, true)

        // Initialize test
        const wrappedCreateGame = TestEnv.wrap(playHvzFunctions.createGame);
        const data = {
            name: FAKE_GAME_NAME,
            startTime: FAKE_START_TIME,
            endTime: FAKE_END_TIME
        }

        // Run test
        await wrappedCreateGame(data, TestEnv.context)

        // Verify result state
        querySnapshot = await gameQuery.get()
        assert.equal(querySnapshot.empty, false)
        assert.equal(querySnapshot.docs.length, 1)
        const gameData = querySnapshot.docs[0].data()
        assert.equal(gameData!["name"], FAKE_GAME_NAME)
        assert.equal(gameData!["creatorUserId"], FAKE_UID)
        assert.equal(gameData!["startTime"], FAKE_START_TIME)
        assert.equal(gameData!["endTime"], FAKE_END_TIME)
        assert.notEqual(gameData!["infectRewardId"], "")
        assert.notEqual(gameData!["adminGroupId"], "")
        assert.notEqual(gameData!["figureheadAdminPlayerAccount"], "")
        await GeneralUtils.deleteDocument(db, querySnapshot.docs[0].ref)
    });

    it('createGame creates managed groups and rewards', async () => {
        // Initialize test
        const wrappedCreateGame = TestEnv.wrap(playHvzFunctions.createGame);
        const data = {
            name: FAKE_GAME_NAME,
            startTime: FAKE_START_TIME,
            endTime: FAKE_END_TIME
        }

        // Run test
        await wrappedCreateGame(data, TestEnv.context)

        // Verify result state
        const querySnapshot = await db.collection("games").where("name", "==", FAKE_GAME_NAME).get()
        const gameSnapshot = querySnapshot.docs[0]
        // Verify 2 rewards created: infections & declare
        const rewardQuerySnapshot = await db.collection("games")
            .doc(gameSnapshot.id)
            .collection("rewards")
            .where("managed", "==", true)
            .get()
        assert.equal(rewardQuerySnapshot.docs.length, 2)
        // Verify 4 groups created: admin, global, human, & zombie
        const groupQuerySnapshot = await db.collection("games")
            .doc(gameSnapshot.id)
            .collection("groups")
            .where("managed", "==", true)
            .get()
        assert.equal(groupQuerySnapshot.docs.length, 4)
        await GeneralUtils.deleteDocument(db, gameSnapshot.ref)
    });

    it('checkGameExists returns game id when game exists', async () => {
        const existingGameName = "alreadyExists";
        const gameRef = db.collection("games").doc(FAKE_GAME_ID);
        await gameRef.set({ "name": existingGameName });
        const wrappedCheckGameExists = TestEnv.wrap(playHvzFunctions.checkGameExists);
        const data = { name: existingGameName };

        const returnedGameId = await wrappedCheckGameExists(data, TestEnv.context)

        assert.equal(returnedGameId, FAKE_GAME_ID)
        await GeneralUtils.deleteDocument(db, gameRef)
    });

    it('checkGameExists throws error when game does not exist', async () => {
        const existingGameName = "doesNotExist"
        const wrappedCheckGameExists = TestEnv.wrap(playHvzFunctions.checkGameExists);
        const data = { name: existingGameName }

        // Game doesn't exist, should throw error.
        await expect(wrappedCheckGameExists(data, TestEnv.context)).to.be.rejected
    });

    it('updateGame invalidates game stats and updates game', async () => {
        const statId = "fakeStatId"
        const statRef = db.collection("games").doc(FAKE_GAME_ID).collection("stats").doc(statId);
        await statRef.set({
            isOutOfDate: false
        })
        const gameRef = db.collection("games").doc(FAKE_GAME_ID);
        await gameRef.set({
            adminOnCallPlayerId: "adminOnCall",
            startTime: 0,
            endTime: 50,
            statId: statId
        })
        const updatedAdminOnCall = "updatedAdminOnCall"
        const updatedStart = 3000
        const updatedEnd = 5000

        const wrappedUpdateGame = TestEnv.wrap(playHvzFunctions.updateGame);
        const data = {
            gameId: FAKE_GAME_ID,
            adminOnCallPlayerId: updatedAdminOnCall,
            startTime: updatedStart,
            endTime: updatedEnd
        }

        await wrappedUpdateGame(data, TestEnv.context)

        const updatedGameData = (await gameRef.get()).data()
        const updatedStatData = (await statRef.get()).data()
        assert.equal(updatedGameData!.adminOnCallPlayerId, updatedAdminOnCall)
        assert.equal(updatedGameData!.startTime, updatedStart)
        assert.equal(updatedGameData!.endTime, updatedEnd)
        assert.equal(updatedStatData!.isOutOfDate, true)
        await GeneralUtils.deleteDocument(db, gameRef)
    });
});
