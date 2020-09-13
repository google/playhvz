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
/**
 * Prefer running tests against a local firebase emulator using:
 * >$ firebase emulators:exec "npm test"
 * Not sure how to pause and inspect that, so use this to connect to the real thing for debugging...
 */

import * as firebase from '@firebase/testing';
import * as admin from 'firebase-admin';
const projectId = "hvz-dev-af10d";

// Set environment variables so we connect to a local Firebase emulator
process.env.FIREBASE_EMULATOR_HUB = "localhost:4400";
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_FIRESTORE_EMULATOR_ADDRESS = 'localhost:8080';
admin.initializeApp({ projectId });

// Set this up after the entire test environment has been set up
const test = require('firebase-functions-test')({
    projectId: projectId,
    firestoreURL: "http://localhost:8080",
}, admin.credential.applicationDefault());

export const db = admin.firestore();
export const playHvzFunctions = require('../src/index');

export const FAKE_UID = "fakeTestUser0"

export const context = {
    auth: {
        uid: FAKE_UID
    },
}

export async function clearFirestoreData() {
    firebase.clearFirestoreData({ projectId });
}

export function wrap(fun: any) {
    return test.wrap(fun)
}

export function after() {
    test.cleanup();
}