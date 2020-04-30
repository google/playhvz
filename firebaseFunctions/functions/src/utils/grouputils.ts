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
  const globalAllegiances = [
    [Defaults.EMPTY_ALLEGIANCE_FILTER, Defaults.globalChatName],
    [Defaults.EMPTY_ALLEGIANCE_FILTER, Defaults.gameAdminChatName],
    [Defaults.HUMAN_ALLEGIANCE_FILTER, Defaults.globalHumanChatName],
    [Defaults.ZOMBIE_ALLEGIANCE_FILTER, Defaults.globalZombieChatName]
  ]

  for (const [allegianceFilter, chatName] of globalAllegiances) {
    let settings = Group.getGlobalGroupSettings(allegianceFilter)
    if (chatName === Defaults.gameAdminChatName) {
      settings = Group.getAdminGroupSettings(allegianceFilter)
    }
    const groupData = Group.createManagedGroup(
      chatName,
      settings,
     )
    const createdGroup = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Group.COLLECTION_PATH)
      .add(groupData);
    const chatData = Chat.create(createdGroup.id, chatName, /* withAdmins= */ false)
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
): Promise<string> {
  const group = Group.createPlayerOwnedGroup(
    playerId,
    chatName,
    /* settings= */ settings,
  )
  const createdGroupDocRef = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Group.COLLECTION_PATH)
    .add(group);
  const chatData = Chat.create(createdGroupDocRef.id, chatName, /* withAdmins= */ false)
  const createdChatDocRef = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Chat.COLLECTION_PATH)
    .add(chatData)
  await ChatUtils.addPlayerToChat(db, gameId, playerId, createdGroupDocRef, createdChatDocRef.id, /* isDocRef= */ true)
  return createdChatDocRef.id
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
  await addPlayerToManagedGroups(db, gameId, playerDocRef, /* ignoreAllegiance= */ false)
  await removePlayerFromGroups(db, gameId, playerDocRef)
}

// Add a new player to managed groups
export async function addPlayerToManagedGroups(db: any, gameId: string, playerDocRef: any, ignoreAllegiance: boolean) {
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
    if (ignoreAllegiance || groupAllegiance === Defaults.EMPTY_ALLEGIANCE_FILTER || groupAllegiance === playerAllegiance) {
      // The player matches the allegiance requirements, add them to the group
      await addPlayerToGroup(db, gameId, groupSnapshot, playerDocRef.id)
    }
  }

  // If player is game creator then add their player id to the game and add them to the managed admin group.
  const gameSnapshot = await db.collection(Game.COLLECTION_PATH).doc(gameId).get()
  const gameData = await gameSnapshot.data()
  if (playerData[Player.FIELD__USER_ID] === gameData[Game.FIELD__CREATOR_USER_ID]) {
    const groupSnapshot = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Group.COLLECTION_PATH)
      .doc(gameData[Game.FIELD__ADMIN_GROUP_ID])
      .get()
    await groupSnapshot.ref.update({
      [Group.FIELD__OWNERS]: admin.firestore.FieldValue.arrayUnion(playerDocSnapshot.id)
    })
    await addPlayerToGroup(db, gameId, groupSnapshot, playerDocRef.id)
    // Also set game creator as default "Admin On Call"
    gameSnapshot.ref.update({
      [Game.FIELD__ADMIN_ON_CALL_PLAYER_ID]: playerDocSnapshot.id
    })
  }
}

/** Adds player to group and updates chat memberships if there is a chat room associated with the group. */
export async function addPlayerToGroup(db: any, gameId: string, groupSnapshot: any, playerId: string) {
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

/** Removes player from group and updates chat memberships if there is a chat room associated with the group. */
export async function removePlayerFromGroup(db: any, gameId: string, groupSnapshot: any, playerDocSnapshot: any) {
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

  const gameData = await (await db.collection(Game.COLLECTION_PATH).doc(gameId).get()).data()
  if (playerQuerySnapshot === null || gameData === undefined) {
    return
  }

  const playerIdArray = new Array();
  playerIdArray.push(gameData[Game.FIELD__FIGUREHEAD_ADMIN_PLAYER_ACCOUNT])
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
