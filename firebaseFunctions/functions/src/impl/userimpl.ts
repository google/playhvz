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

import * as User from '../data/user';

/**
 * Function to create a new game and all the internals required.
 */
export async function registerDevice(
  db: any,
  uid: string,
  deviceToken: string
): Promise<string> {
  const updatedData = { 'deviceToken': deviceToken };
  return await db.collection(User.COLLECTION_PATH).doc(uid).set(updatedData);
}
