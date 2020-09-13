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
const FAKE_DEVICE_TOKEN = "fakeDeviceToken"

describe('User Collection Tests', () => {
    beforeEach(async () => {
        await TestEnv.clearFirestoreData()
    });

    after(async () => {
        await TestEnv.clearFirestoreData()
        TestEnv.after();
    });

    it('registerDevice creates user account if it does not exist', async () => {
        // Verify current state
        const fakeUserRef = db.collection("users").doc(FAKE_UID)
        const beforeData = (await fakeUserRef.get()).data()
        assert.equal(beforeData, undefined)

        // Initialize test
        const wrappedRegisterDevice = TestEnv.wrap(playHvzFunctions.registerDevice);
        const data = { deviceToken: FAKE_DEVICE_TOKEN }

        // Run test
        await wrappedRegisterDevice(data, TestEnv.context)

        // Verify result state
        const afterData = (await db.collection("users").doc(FAKE_UID).get()).data()
        assert.equal(afterData!["deviceToken"], FAKE_DEVICE_TOKEN)
    });

    it('registerDevice updates deviceToken', async () => {
        // Initialize test
        const fakeUserRef = db.collection("users").doc(FAKE_UID)
        await fakeUserRef.set({ "deviceToken": "invalid" })
        const wrappedRegisterDevice = TestEnv.wrap(playHvzFunctions.registerDevice);
        const data = { deviceToken: FAKE_DEVICE_TOKEN }

        // Run test
        await wrappedRegisterDevice(data, TestEnv.context)

        // Verify result state
        const afterData = (await db.collection("users").doc(FAKE_UID).get()).data()
        assert.equal(afterData!["deviceToken"], FAKE_DEVICE_TOKEN)
    });
});
