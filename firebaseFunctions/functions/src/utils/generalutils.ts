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

export function hashString(hashableString: string): number {
    let hash: number = 0;
    if (hashableString.length === 0) return hash;
    for (let i= 0; i < hashableString.length; i++) {
        const char = hashableString.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

export function getTimestamp(): any {
  return admin.firestore.Timestamp.now()
}

/* There's a javascript bug with %, use our own function so negatives mod correctly. */
export function mod(randValue: number, maxValue: number): number {
    return ((randValue % maxValue) + maxValue) % maxValue;
}

export function verifySignedIn(context: any) {
  if (!context.auth) {
      // Throwing an HttpsError so that the client gets the error details.
      throw new functions.https.HttpsError(
        'unauthenticated', 'The function must be called while authenticated.');
  }
}

// Verifies that the provided args are type "string" and are not empty.
export function verifyStringArgs(args: any []) {
  for (const arg of args) {
    if (!(typeof arg === 'string')) {
      throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
    }
    if (arg.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', "The function must be called with a non-empty string arg.");
    }
  }
}