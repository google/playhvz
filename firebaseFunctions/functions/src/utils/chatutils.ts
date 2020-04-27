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

import * as Game from '../data/game';
import * as Group from '../data/group';
import * as Player from '../data/player';

// Add player to specified chat room and group
export async function addPlayerToChat(
  db: any,
  gameId: string,
  playerId: string,
  groupDocRefOrSnapshot: any,
  chatRoomId: string,
  isDocRef: boolean
) {

  if (chatRoomId === undefined || groupDocRefOrSnapshot === undefined) {
    console.error("ChatRoomId or group was undefined when trying to add player to chat.")
    return
  }
  const playerDocSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .doc(playerId)
    .get()

    if (isDocRef) {
      await groupDocRefOrSnapshot.update({
        [Group.FIELD__MEMBERS]: admin.firestore.FieldValue.arrayUnion(playerDocSnapshot.id)
      });
    } else {
      await groupDocRefOrSnapshot.ref.update({
        [Group.FIELD__MEMBERS]: admin.firestore.FieldValue.arrayUnion(playerDocSnapshot.id)
      });
    }
    // We have to use dot-notation or firebase will overwrite the entire field.
    const membershipField = Player.FIELD__CHAT_MEMBERSHIPS + "." + chatRoomId
    const chatMembershipValue = {
      [Player.FIELD__CHAT_VISIBILITY]: true,
      [Player.FIELD__CHAT_NOTIFICATIONS]: true
    }
    await playerDocSnapshot.ref.update({
      [membershipField]: chatMembershipValue
    })
}

// Remove player from specified chat room and group
export async function removePlayerFromChat(
  db: any,
  gameId: string,
  playerDocSnapshot: any,
  groupDocSnapshot: any,
  chatRoomId: string
) {
  await groupDocSnapshot.ref.update({
    [Group.FIELD__MEMBERS]: admin.firestore.FieldValue.arrayRemove(playerDocSnapshot.id)
  });

  // We have to use dot-notation or firebase will overwrite the entire field.
  const membershipField = Player.FIELD__CHAT_MEMBERSHIPS + "." + chatRoomId
  await playerDocSnapshot.ref.update({
    [membershipField]: admin.firestore.FieldValue.delete()
  })
}

