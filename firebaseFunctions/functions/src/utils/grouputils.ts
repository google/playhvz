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
export async function createManagedGroups(db: any, uid: any, gameId: string) {
  const globalAllegiances = new Map()
  globalAllegiances.set(Defaults.EMPTY_ALLEGIANCE_FILTER, Defaults.globalChatName)
  globalAllegiances.set(Defaults.HUMAN_ALLEGIANCE_FILTER, Defaults.globalHumanChatName)
  globalAllegiances.set(Defaults.ZOMBIE_ALLEGIANCE_FILTER, Defaults.globalZombieChatName)

  for (const [allegianceFilter, chatName] of globalAllegiances) {
    const groupData = Group.createManagedGroup(
      /* name= */ chatName,
      /* settings= */ Group.getGlobalGroupSettings(allegianceFilter),
     )
    const createdGroup = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Group.COLLECTION_PATH)
      .add(groupData);
    const chatData = Chat.create(createdGroup.id, chatName)
    await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Chat.COLLECTION_PATH)
      .add(chatData)
  }
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
  const createdGroupDocRef = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Group.COLLECTION_PATH)
    .add(group);
  const chatData = Chat.create(createdGroupDocRef.id, chatName)
  const createdChatDocRef = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Chat.COLLECTION_PATH)
    .add(chatData)
  await ChatUtils.addPlayerToChat(db, gameId, playerId, createdGroupDocRef, createdChatDocRef.id, /* isDocRef= */ true)
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

// Add a new player to managed groups
export async function updatePlayerMembershipInGroups(db: any, gameId: string, playerDocRef: any) {
  await addPlayerToManagedGroups(db, gameId, playerDocRef)
  await removePlayerFromGroups(db, gameId, playerDocRef)
}

// Add a new player to managed groups
export async function addPlayerToManagedGroups(db: any, gameId: string, playerDocRef: any) {
  const managedGroupQuery = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Group.COLLECTION_PATH)
    .where(Group.FIELD__MANAGED, "==", true)
    .where(Group.FIELD__SETTINGS + "." + Group.FIELD__SETTINGS_AUTO_ADD, "==", true)
    .get()

  if (managedGroupQuery.empty) {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot find global chat.');
  }

  const playerDocSnapshot = await playerDocRef.get()
  const playerData = await playerDocSnapshot.data()
  const playerAllegiance = playerData[Player.FIELD__ALLEGIANCE]

  for (const groupSnapshot of managedGroupQuery.docs) {
    const groupData = groupSnapshot.data()
    if (groupData === undefined) {
      continue
    }
    const groupAllegiance = groupData[Group.FIELD__SETTINGS][Group.FIELD__SETTINGS_ALLEGIANCE_FILTER]
    if (groupAllegiance === Defaults.EMPTY_ALLEGIANCE_FILTER || groupAllegiance === playerAllegiance) {
      // The player matches the allegiance requirements, add them to the group
      await addPlayerToGroup(db, gameId, groupSnapshot, playerDocRef.id)
    }
  }
}

async function addPlayerToGroup(db: any, gameId: string, groupSnapshot: any, playerId: string) {
  // Check if group is associated with Chat
  const querySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Chat.COLLECTION_PATH)
    .where(Chat.FIELD__GROUP_ID, "==", groupSnapshot.id)
    .get()

  if (querySnapshot.empty) {
    // Group is not associated with any chat rooms, just update membership directly
    await groupSnapshot.ref.update({
      [Group.FIELD__MEMBERS]: admin.firestore.FieldValue.arrayUnion(playerId)
    });
    return
  }
  // Group is associated with a chat room (we can assume only one chat room per group).
  const chatRoomId = querySnapshot.docs[0].id
  await ChatUtils.addPlayerToChat(db, gameId, playerId, groupSnapshot, chatRoomId, /* isDocRef= */ false)
}

async function removePlayerFromGroup(db: any, gameId: string, groupSnapshot: any, playerDocSnapshot: any) {
  // Check if group is associated with Chat
  const querySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Chat.COLLECTION_PATH)
    .where(Chat.FIELD__GROUP_ID, "==", groupSnapshot.id)
    .get()

  if (querySnapshot.empty) {
    // Group is not associated with any chat rooms, just update membership directly
    await groupSnapshot.ref.update({
      [Group.FIELD__MEMBERS]: admin.firestore.FieldValue.arrayRemove(playerDocSnapshot.id)
    });
    return
  }
  // Group is associated with a chat room (we can assume only one chat room per group).
  const chatRoomId = querySnapshot.docs[0].id
  await ChatUtils.removePlayerFromChat(db, gameId, playerDocSnapshot, groupSnapshot, chatRoomId)
}

// Handles Auto-adding and Auto-removing members
export async function updateMissionMembership(db: any, gameId: string, groupId: string) {
  const group = await db.collection(Game.COLLECTION_PATH)
          .doc(gameId)
          .collection(Group.COLLECTION_PATH)
          .doc(groupId)
          .get()
  await autoUpdateMembers(db, gameId, group)
}

// Replaces members with members of the correct allegiance if appropriate
async function autoUpdateMembers(db: any, gameId: string, group: any) {
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


// Remove player from *any* auto-remove groups
async function removePlayerFromGroups(db: any, gameId: string, playerDocRef: any) {
  const autoRemoveGroupQuery = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Group.COLLECTION_PATH)
    .where(Group.FIELD__SETTINGS + "." + Group.FIELD__SETTINGS_AUTO_REMOVE, "==", true)
    .get()

  if (autoRemoveGroupQuery.empty) {
    return
  }

  const playerDocSnapshot = await playerDocRef.get()
  const playerData = await playerDocSnapshot.data()
  const playerAllegiance = playerData[Player.FIELD__ALLEGIANCE]

  for (const groupSnapshot of autoRemoveGroupQuery.docs) {
    const groupData = groupSnapshot.data()
    if (groupData === undefined) {
      continue
    }
    const groupAllegiance = groupData[Group.FIELD__SETTINGS][Group.FIELD__SETTINGS_ALLEGIANCE_FILTER]
    if (groupAllegiance !== Defaults.EMPTY_ALLEGIANCE_FILTER && groupAllegiance !== playerAllegiance) {
      // The player does not match the allegiance requirements, remove them from the group
      await removePlayerFromGroup(db, gameId, groupSnapshot, playerDocSnapshot)
    }
  }
}
