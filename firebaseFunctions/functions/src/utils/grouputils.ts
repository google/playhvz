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

import * as Chat from '../data/chat';
import * as ChatUtils from './chatutils';
import * as Defaults from '../data/defaults';
import * as Game from '../data/game';
import * as Group from '../data/group';
import * as Mission from '../data/mission';
import * as Player from '../data/player';

// Creates a group
export async function createGlobalGroup(db: any, uid: any, gameId: string) {
  const group = Group.createManagedGroup(
    /* name= */ Defaults.globalChatName,
    /* settings= */ Group.getGlobalGroupSettings(),
  )
  const createdGroup = await db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Group.COLLECTION_PATH).add(group);
  const chat = Chat.create(createdGroup.id, Defaults.globalChatName)
  await db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Chat.COLLECTION_PATH).add(chat)
}

// Creates a group and chat
export async function createGroupAndChat(
  db: any,
  uid: any,
  gameId: string,
  playerId: string,
  chatName: string,
  settings: any
) {
  const group = Group.createPlayerOwnedGroup(
    playerId,
    chatName,
    /* settings= */ settings,
  )
  const createdGroup = await db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Group.COLLECTION_PATH).add(group);
  const chat = Chat.create(createdGroup.id, chatName)
  const createdChat = await db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Chat.COLLECTION_PATH).add(chat)
  await ChatUtils.addPlayerToChat(db, gameId, playerId, createdGroup, createdChat.id, /* isNewGroup= */ true)
}

// Creates a group and mission
export async function createGroupAndMission(
  db: any,
  gameId: string,
  settings: any,
  missionName: string,
  startTime: number,
  endTime: number,
  details: string,
  allegianceFilter: string
) {
  const group = Group.createManagedGroup(missionName, settings)
  const createdGroup = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Group.COLLECTION_PATH)
    .add(group);
  const mission = Mission.create(
    createdGroup.id,
    missionName,
    startTime,
    endTime,
    details,
    allegianceFilter
  )
  await db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Mission.COLLECTION_PATH).add(mission)
  await updateMissionMembership(db, gameId, createdGroup.id)
}


// Add player to global chatroom
export async function addNewPlayerToGroups(db: any, gameId: string, player: any) {
  const groupQuery = await db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Group.COLLECTION_PATH)
  .where(Group.FIELD__MANAGED, "==", true)
  .where(Group.FIELD__NAME, "==", Defaults.globalChatName).get()

  if (groupQuery.empty || groupQuery.docs.length > 1) {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot find global chat.');
  }
  const group = groupQuery.docs[0];
  const chatQuery = await db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Chat.COLLECTION_PATH)
    .where(Chat.FIELD__GROUP_ID, "==", group.id).get()
  if (chatQuery.empty || chatQuery.docs.length > 1) {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot find chatroom associated with group.');
  }

  await group.ref.update({
      [Group.FIELD__MEMBERS]: admin.firestore.FieldValue.arrayUnion(player.id)
  });

  const chatId = chatQuery.docs[0].id;
  const chatVisibility = {[Player.FIELD__CHAT_VISIBILITY]: true}
  // We have to use dot-notation or firebase will overwrite the entire field.
  const membershipField = Player.FIELD__CHAT_MEMBERSHIPS + "." + chatId
  await player.update({
    [membershipField]: chatVisibility
  })
}


// Handles Auto-adding and Auto-removing members
export async function updateMissionMembership(db: any, gameId: string, groupId: string) {
  const group = await db.collection(Game.COLLECTION_PATH)
          .doc(gameId)
          .collection(Group.COLLECTION_PATH)
          .doc(groupId)
          .get()
  await autoAddMembers(db, gameId, group)
}

// Adds members if appropriate
async function autoAddMembers(db: any, gameId: string, group: any) {
  const groupData = group.data()
  if (groupData === undefined) {
    return
  }
  if (groupData[Group.FIELD__MANAGED] !== true
      && groupData[Group.FIELD__SETTINGS][Group.FIELD__SETTINGS_AUTO_ADD] !== true) {
    return
  }

  let playerQuerySnapshot = null
  if (groupData[Group.FIELD__SETTINGS][Group.FIELD__SETTINGS_ALLEGIANCE_FILTER] === Defaults.EMPTY_ALLEGIANCE_FILTER) {
    // Add all players to the group
    playerQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Player.COLLECTION_PATH)
      .get()
  } else {
    // Add all players of the correct allegiance to the group
    playerQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Player.COLLECTION_PATH)
      .where(Player.FIELD__ALLEGIANCE, "==", groupData[Group.FIELD__SETTINGS][Group.FIELD__SETTINGS_ALLEGIANCE_FILTER])
      .get()
  }

  if (playerQuerySnapshot === null) {
    return
  }
  const playerIdArray = new Array();
  playerQuerySnapshot.forEach((playerDoc: any) => {
    playerIdArray.push(playerDoc.id)
  });
  if (playerIdArray.length > 0) {
    await group.ref.update({
        [Group.FIELD__MEMBERS]: playerIdArray
      })
  }
}