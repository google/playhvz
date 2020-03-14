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
  group: any,
  chatRoomId: string,
  isNewGroup: boolean
) {
  const player = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .doc(playerId)
    .get()

    if (isNewGroup) {
      await group.update({
          [Group.FIELD__MEMBERS]: admin.firestore.FieldValue.arrayUnion(player.id)
        });
    } else {
      await group.ref.update({
              [Group.FIELD__MEMBERS]: admin.firestore.FieldValue.arrayUnion(player.id)
            });
    }

    // We have to use dot-notation or firebase will overwrite the entire field.
    const membershipField = Player.FIELD__CHAT_MEMBERSHIPS + "." + chatRoomId
    const chatVisibility = {[Player.FIELD__CHAT_VISIBILITY]: true}
    await player.ref.update({
      [membershipField]: chatVisibility
    })
}

// Remove player from specified chat room and group
export async function removePlayerFromChat(
  db: any,
  gameId: string,
  player: any,
  group: any,
  chatRoomId: string
) {
  await group.ref.update({
    [Group.FIELD__MEMBERS]: admin.firestore.FieldValue.arrayRemove(player.id)
  });

  // We have to use dot-notation or firebase will overwrite the entire field.
  const membershipField = Player.FIELD__CHAT_MEMBERSHIPS + "." + chatRoomId
  await player.ref.update({
    [membershipField]: admin.firestore.FieldValue.delete()
  })
}
