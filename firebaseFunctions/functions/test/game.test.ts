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
const assert = chai.assert;
import * as TestEnv from './testsetup';

const db = TestEnv.db;
const playHvzFunctions = TestEnv.playHvzFunctions;
const FAKE_UID = TestEnv.FAKE_UID
const FAKE_GAME_NAME = "gameName"
const FAKE_START_TIME = 0
const FAKE_END_TIME = 5

describe('Game Collection Tests', () => {
    beforeEach(async () => {
        await TestEnv.clearFirestoreData()
    });

    after(async () => {
        await TestEnv.clearFirestoreData()
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
    });

    it('createGame creates managed groups and rewards', async () => {
        await TestEnv.clearFirestoreData()
        // Initialize test
        const wrappedCreateGame = TestEnv.wrap(playHvzFunctions.createGame);
        const data = {
            name: FAKE_GAME_NAME + "1",
            startTime: FAKE_START_TIME,
            endTime: FAKE_END_TIME
        }

        // Run test
        await wrappedCreateGame(data, TestEnv.context)

        // Verify result state
        const querySnapshot = await db.collection("games").where("name", "==", FAKE_GAME_NAME + "1").get()
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
    });

});
