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
import * as Game from '../data/game';
import * as Player from '../data/player';
import * as Universal from '../data/universal';

// Returns a Query listing all players in the given game that are owned by this user.
export function getUsersPlayersQuery(db: any, uid: any, gameId: string) {
  return db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Player.COLLECTION_PATH)
      .where(Universal.FIELD__USER_ID, "==", uid);
}

// Returns a Query listing all players in the given game that have the given name.
export function getPlayersWithNameQuery(db: any, gameId: string, playerName: string) {
  return db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Player.COLLECTION_PATH)
      .where(Player.FIELD__NAME, "==", playerName);
}
