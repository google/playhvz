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

import * as Chat from './data/chat';
import * as ChatUtils from './utils/chatutils';
import * as Defaults from './data/defaults';
import * as Game from './data/game';
import * as GameImpl from './impl/gameimpl';
import * as GeneralUtils from './utils/generalutils';
import * as Group from './data/group';
import * as GroupUtils from './utils/grouputils';
import * as Player from './data/player';
import * as PlayerUtils from './utils/playerutils';
import * as Message from './data/message';
import * as Mission from './data/mission';
import * as QuizQuestion from './data/quizquestion';
import * as RewardImpl from './impl/rewardimpl';
import * as RewardUtils from './utils/rewardutils';
import * as User from './data/user';

admin.initializeApp();
const db = admin.firestore();

/*******************************************************
* USER functions
********************************************************/

exports.registerDevice = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const deviceToken = data.deviceToken;
  GeneralUtils.verifyStringArgs([deviceToken])

  const updatedData = {'deviceToken': deviceToken};
  return await db.collection(User.COLLECTION_PATH).doc(context.auth!.uid).set(updatedData);
});



/*******************************************************
* GAME functions
********************************************************/

exports.createGame = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const name = trimmedString(data.name);
  const startTime = data.startTime
  const endTime = data.endTime
  GeneralUtils.verifyStringArgs([name])
  GeneralUtils.verifyNumberArgs([startTime, endTime])
  return await GameImpl.createGame(db, context.auth!.uid, name, startTime, endTime)
});

exports.updateGame = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId
  const adminOnCallPlayerId = data.adminOnCallPlayerId
  const startTime = data.startTime
  const endTime = data.endTime
  GeneralUtils.verifyStringArgs([gameId, adminOnCallPlayerId])
  GeneralUtils.verifyNumberArgs([startTime, endTime])
  await GameImpl.updateGame(db, gameId, adminOnCallPlayerId, startTime, endTime)
});

exports.checkGameExists = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const name = trimmedString(data.name);
  GeneralUtils.verifyStringArgs([name])
  await GameImpl.checkGameExists(db, name)
});


exports.joinGame = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameName = trimmedString(data.gameName);
  const playerName = trimmedString(data.playerName);
  GeneralUtils.verifyStringArgs([gameName, playerName])
  return await GameImpl.joinGame(db, context.auth!.uid, gameName, playerName)
});

exports.deleteGame = functions.runWith({
    timeoutSeconds: 540,
    memory: '2GB'
}).https.onCall(async (data, context) => {
  GeneralUtils.verifyIsGameOwner(context)
  const gameId = data.gameId;
  GeneralUtils.verifyStringArgs([gameId])
  await GameImpl.deleteGame(db, context.auth!.uid, gameId)
});

/*******************************************************
* PLAYER functions
********************************************************/

exports.changePlayerAllegiance = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const playerId = data.playerId;
  const newAllegiance = data.allegiance;
  GeneralUtils.verifyStringArgs([gameId, playerId, newAllegiance])
  await PlayerUtils.internallyChangePlayerAllegiance(db, gameId, playerId, newAllegiance)
});


exports.infectPlayerByLifeCode = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const infectorPlayerId = data.infectorPlayerId
  const lifeCode = GeneralUtils.normalizeLifeCode(data.lifeCode);
  GeneralUtils.verifyStringArgs([gameId, infectorPlayerId, lifeCode])

  // Check if life code is associated with valid human player.
  const lifeCodeStatusField = Player.FIELD__LIVES + "." + lifeCode + "." + Player.FIELD__LIFE_CODE_STATUS
  const infectedPlayerQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .where(lifeCodeStatusField, "==", /* isActive= */ true)
    .get()

  if (infectedPlayerQuerySnapshot.empty || infectedPlayerQuerySnapshot.docs.length > 1) {
     throw new functions.https.HttpsError('failed-precondition', 'No valid player with given life code exists.');
  }
  const infectedPlayerSnapshot = infectedPlayerQuerySnapshot.docs[0];
  const infectedPlayerData = await infectedPlayerSnapshot.data()
  if (infectedPlayerData === undefined) {
    return
  }

  // TODO: handle player infecting themselves.

  // Use up the life code and infect the player if they are out of lives
  if (infectedPlayerData[Player.FIELD__ALLEGIANCE] === Defaults.HUMAN_ALLEGIANCE_FILTER) {
    // TODO: make this a transaction.
    await RewardUtils.giveRewardForInfecting(db, gameId, infectorPlayerId)
    // Mark life code as used, aka deactivated
    await infectedPlayerSnapshot.ref.update({
      [lifeCodeStatusField]: false
    })

    const lives = infectedPlayerData[Player.FIELD__LIVES]
    if (lives === undefined) {
      return
    }
    for (const key of Object.keys(lives)) {
      const metadata = lives[key]
      if (metadata === undefined) {
        continue
      }
      if (metadata[Player.FIELD__LIFE_CODE_STATUS] === true
          && metadata[Player.FIELD__LIFE_CODE] !== lifeCode) {
        // Player still has some lives left, don't turn them into a zombie.
        console.log("Not turning player to zombie, they still have life codes active.")
        return
      }
    }
    await PlayerUtils.internallyChangePlayerAllegiance(db, gameId, infectedPlayerSnapshot.id, Defaults.ZOMBIE_ALLEGIANCE_FILTER)
  }
});

/*******************************************************
* GROUP functions
********************************************************/

exports.addPlayersToGroup = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const groupId = data.groupId;
  const playerIdList = data.playerIdList
  GeneralUtils.verifyStringArgs([gameId, groupId])
  // TODO: verify player id list

  const groupSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Group.COLLECTION_PATH)
    .doc(groupId)
    .get();

  for (const playerId of playerIdList) {
    await GroupUtils.addPlayerToGroup(db, gameId, groupSnapshot, playerId)
  }
});

exports.removePlayerFromGroup = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const playerId = data.playerId;
  const groupId = data.groupId;
  GeneralUtils.verifyStringArgs([gameId, playerId, groupId])

  const playerSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .doc(playerId)
    .get()

  const groupSnapshot = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Group.COLLECTION_PATH)
      .doc(groupId)
      .get()
  await GroupUtils.removePlayerFromGroup(db, gameId, groupSnapshot, playerSnapshot)
});


/*******************************************************
* CHAT functions
********************************************************/

exports.addPlayersToChat = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const groupId = data.groupId;
  const chatRoomId = data.chatRoomId;
  const playerIdList = data.playerIdList
  GeneralUtils.verifyStringArgs([gameId, groupId, chatRoomId])
  // TODO: verify player id list

  const groupDocSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Group.COLLECTION_PATH)
    .doc(groupId)
    .get();

  for (const playerId of playerIdList) {
    await ChatUtils.addPlayerToChat(db, gameId, playerId, groupDocSnapshot, chatRoomId, /* isDocRef= */ false)
  }
});

exports.removePlayerFromChat = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const playerId = data.playerId;
  const chatRoomId = data.chatRoomId;
  GeneralUtils.verifyStringArgs([gameId, playerId, chatRoomId])

  const playerSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .doc(playerId)
    .get()

  const chatRoomData = (await db.collection(Game.COLLECTION_PATH)
     .doc(gameId)
     .collection(Chat.COLLECTION_PATH)
     .doc(chatRoomId)
     .get())
     .data();
  if (chatRoomData === undefined) {
    console.log("Chat room was undefined, not removing player.")
    return
  }

  const group = await db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Group.COLLECTION_PATH)
      .doc(chatRoomData[Chat.FIELD__GROUP_ID])
      .get()

  if (chatRoomData[Chat.FIELD__WITH_ADMINS]) {
    const visibilityField = Player.FIELD__CHAT_MEMBERSHIPS + "." + chatRoomId + "." + Player.FIELD__CHAT_VISIBILITY
    await playerSnapshot.ref.update({
      [visibilityField]: false
    })
    return
  }

  await ChatUtils.removePlayerFromChat(db, gameId, playerSnapshot, group, chatRoomId)
});

// Creates a chat room
// TODO: make this happen as a single transaction
exports.createChatRoom = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const ownerId = data.ownerId;
  const chatName = data.chatName;
  const allegianceFilter = data.allegianceFilter
  GeneralUtils.verifyStringArgs([gameId, ownerId, chatName, allegianceFilter])

  const settings = Group.createSettings(
    /* addSelf= */ true,
    /* addOthers= */ true,
    /* removeSelf= */ true,
    /* removeOthers= */ true,
    /* autoAdd= */ false,
    /* autoRemove= */ allegianceFilter !== Defaults.EMPTY_ALLEGIANCE_FILTER,
    allegianceFilter);

    await GroupUtils.createGroupAndChat(db, context.auth!.uid, gameId, ownerId, chatName, settings);
})

// Creates a chat room
// TODO: make this happen as a single transaction
exports.createOrGetChatWithAdmin = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const playerId = data.playerId;
  GeneralUtils.verifyStringArgs([gameId, playerId])

  const playerSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Player.COLLECTION_PATH)
    .doc(playerId)
    .get()

  const playerData = playerSnapshot.data()
  const gameData = await (await db.collection(Game.COLLECTION_PATH).doc(gameId).get()).data()
  if (playerData === undefined || gameData === undefined) {
    return
  }
  const playerChatRoomIds = Object.keys(playerData[Player.FIELD__CHAT_MEMBERSHIPS])
  const adminPlayerId = gameData[Game.FIELD__FIGUREHEAD_ADMIN_PLAYER_ACCOUNT]

  const adminQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Chat.COLLECTION_PATH)
    .where(admin.firestore.FieldPath.documentId(), "in", Array.from(playerChatRoomIds))
    .where(Chat.FIELD__WITH_ADMINS, "==", true)
    .get()

  if (!adminQuerySnapshot.empty) {
    // Admin chat already exists, reusing the existing chat.
    const adminChatSnapshot = adminQuerySnapshot.docs[0]
    const visibilityField = Player.FIELD__CHAT_MEMBERSHIPS + "." + adminChatSnapshot.id + "." + Player.FIELD__CHAT_VISIBILITY
    await playerSnapshot.ref.update({
      [visibilityField]: true
    })

    // "Add" the admin to the chat. Even if they are already in it, this resets their notification
    // and visibility settings so the chat reappears for them.
    const adminChatData = await adminChatSnapshot.data()
    if (adminChatData === undefined) {
      return adminChatSnapshot.id
    }
    await ChatUtils.addPlayerToChat(db,
                gameId,
                adminPlayerId,
                db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Group.COLLECTION_PATH).doc(adminChatData[Chat.FIELD__GROUP_ID]),
                adminChatSnapshot.id,
                /* isDocRef= */ true)
    return adminChatSnapshot.id
  }

  // Create admin chat since it doesn't exist.
  const chatName = playerData[Player.FIELD__NAME] + " & " + Defaults.FIGUREHEAD_ADMIN_NAME

  const settings = Group.createSettings(
    /* addSelf= */ true,
    /* addOthers= */ false,
    /* removeSelf= */ true,
    /* removeOthers= */ false,
    /* autoAdd= */ false,
    /* autoRemove= */ false,
    Defaults.EMPTY_ALLEGIANCE_FILTER);

  const createdChatId = await GroupUtils.createGroupAndChat(db, context.auth!.uid, gameId, playerId, chatName, settings);
  const chatSnapshot = await db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Chat.COLLECTION_PATH)
    .doc(createdChatId)
    .get()
  await chatSnapshot.ref.update({
    [Chat.FIELD__WITH_ADMINS]: true
  })

  const createdChatData = await chatSnapshot.data()
  if (createdChatData === undefined) {
    return createdChatId
  }
  await ChatUtils.addPlayerToChat(db,
    gameId,
    adminPlayerId,
    db.collection(Game.COLLECTION_PATH).doc(gameId).collection(Group.COLLECTION_PATH).doc(createdChatData[Chat.FIELD__GROUP_ID]),
    createdChatId,
    /* isDocRef= */ true)
  return createdChatId
})

/**
 * Triggers when a new message is added to a chat room.
 * TODO: send notifications batched instead of one at a time.
 * TODO: for chat with admins if room isn't visible, trigger notification & set room to visible again
 */
exports.triggerChatNotification = functions.firestore
  .document(Game.COLLECTION_PATH + "/{gameId}/" + Chat.COLLECTION_PATH + "/{chatId}/" + Message.COLLECTION_PATH + "/{messageId}")
  .onCreate(async (messageSnapshot, context) => {
      const gameId = context.params.gameId;
      const chatId = context.params.chatId;
      const messageData = await messageSnapshot.data()
      if (messageData === undefined) {
        return
      }
      const senderId = messageData[Message.FIELD__SENDER_ID]

      // Query for all the players in this chat that are allowing notifications.
      const chatMembershipQueryField = Player.FIELD__CHAT_MEMBERSHIPS + "." + chatId + "." + Player.FIELD__CHAT_NOTIFICATIONS
      const playersToNotifyQuerySnapshot = await db.collection(Game.COLLECTION_PATH)
        .doc(gameId)
        .collection(Player.COLLECTION_PATH)
        .where(chatMembershipQueryField, "==", true)
        .get()

      if (playersToNotifyQuerySnapshot.empty) {
        // No one to notify
        return
      }

      // Build notification contents
      const senderData = await (
        await db.collection(Game.COLLECTION_PATH)
          .doc(gameId)
          .collection(Player.COLLECTION_PATH)
          .doc(senderId)
          .get()
      ).data()
      const chatRoomData = await (
        await db.collection(Game.COLLECTION_PATH)
          .doc(gameId)
          .collection(Chat.COLLECTION_PATH)
          .doc(chatId)
          .get()
      ).data()
      if (senderData === undefined || chatRoomData === undefined) {
        return
      }
      const notificationPayload = {
        notification: {
          title: `${senderData[Player.FIELD__NAME]} — ${chatRoomData[Chat.FIELD__NAME]}`,
          body: `${messageData[Message.FIELD__MESSAGE]}`,
        }
      }

      const gameData = await (await db.collection(Game.COLLECTION_PATH)
        .doc(gameId)
        .get())
        .data()
      if (gameData === undefined) {
        return
      }

      const playerIdArray = new Array();
      for (const playerSnapshot of playersToNotifyQuerySnapshot.docs) {
        playerIdArray.push(playerSnapshot.id)
      }

      // Get player device tokens and send notification.
      for (const playerSnapshot of playersToNotifyQuerySnapshot.docs) {
        if (playerSnapshot.id === senderId) {
          // Don't notify the user that sent the message.
          continue
        }
        // If player is the admin player then notify the admin on-call player instead.
        let playerData: any = playerSnapshot.data()
        if (playerSnapshot.id === gameData[Game.FIELD__FIGUREHEAD_ADMIN_PLAYER_ACCOUNT]) {
          if (playerIdArray.includes(gameData[Game.FIELD__ADMIN_ON_CALL_PLAYER_ID])) {
            // Admin on call player is already getting notified about this message.
            continue
          }
          playerData = (await db.collection(Game.COLLECTION_PATH)
            .doc(gameId)
            .collection(Player.COLLECTION_PATH)
            .doc(gameData[Game.FIELD__ADMIN_ON_CALL_PLAYER_ID])
            .get())
            .data()
        }
        if (playerData === undefined) {
          continue
        }
        // Get player's device token to notify
        const userData = await (await db
            .collection(User.COLLECTION_PATH)
            .doc(playerData[Player.FIELD__USER_ID])
            .get()
          ).data()
        if (userData === undefined) {
          continue
        }
        const deviceToken = userData[User.FIELD__DEVICE_TOKEN]
        if (deviceToken.length > 0) {
          // Notify device
          await admin.messaging().sendToDevice(deviceToken, notificationPayload)
        }
      }
});

/*******************************************************
* MISSION functions
********************************************************/

exports.createMission = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const missionName = data.name;
  const startTime = data.startTime;
  const endTime = data.endTime;
  const details = data.details;
  const allegianceFilter = data.allegianceFilter
  GeneralUtils.verifyStringArgs([gameId, missionName, allegianceFilter])
  GeneralUtils.verifyOptionalStringArgs([details])
  GeneralUtils.verifyNumberArgs([startTime, endTime])

  const settings = Group.createSettings(
    /* addSelf= */ false,
    /* addOthers= */ false,
    /* removeSelf= */ false,
    /* removeOthers= */ false,
    /* autoAdd= */ true,
    /* autoRemove= */ allegianceFilter !== Defaults.EMPTY_ALLEGIANCE_FILTER,
    allegianceFilter);

    await GroupUtils.createGroupAndMission(
      db,
      gameId,
      settings,
      missionName,
      startTime,
      endTime,
      details,
      allegianceFilter
    )
})

// TODO: run this as a transaction
exports.updateMission = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const missionId = data.missionId;
  const missionName = data.name;
  const startTime = data.startTime;
  const endTime = data.endTime;
  const details = data.details;
  const allegianceFilter = data.allegianceFilter
  GeneralUtils.verifyStringArgs([gameId, missionId, missionName, allegianceFilter])
  GeneralUtils.verifyOptionalStringArgs([details])
  GeneralUtils.verifyNumberArgs([startTime, endTime])

  const missionRef = db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Mission.COLLECTION_PATH)
    .doc(missionId)

  const missionData = (await missionRef.get()).data()
  if (missionData === undefined) {
    return
  }
  const associatedGroupId = missionData[Mission.FIELD__GROUP_ID]

  await missionRef.update({
    [Mission.FIELD__NAME]: missionName,
    [Mission.FIELD__START_TIME]: startTime,
    [Mission.FIELD__END_TIME]: endTime,
    [Mission.FIELD__DETAILS]: details,
    [Mission.FIELD__ALLEGIANCE_FILTER]: allegianceFilter
  });

  const groupRef = db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(Group.COLLECTION_PATH)
      .doc(associatedGroupId);
  // We have to use dot-notation or firebase will overwrite the entire field.
  const allegianceField = Group.FIELD__SETTINGS + "." + Group.FIELD__SETTINGS_ALLEGIANCE_FILTER
  await groupRef.update({
    [Group.FIELD__NAME]: missionName,
    [allegianceField]: allegianceFilter
  })
  await GroupUtils.updateMissionMembership(db, gameId, associatedGroupId)
})

exports.deleteMission = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const missionId = data.missionId;
  GeneralUtils.verifyStringArgs([gameId, missionId])

  // Delete the mission document recursively
  const missionRef = db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Mission.COLLECTION_PATH)
    .doc(missionId);
  const missionData = (await missionRef.get()).data()
  if (missionData === undefined) {
    return
  }
  const associatedGroupId = missionData[Mission.FIELD__GROUP_ID]
  await missionRef.listCollections().then(async (collections: any) => {
    for (const collection of collections) {
      await GeneralUtils.deleteCollection(db, collection)
    }
    await missionRef.delete()
  });

  // Delete the associated group document recursively
  console.log(`Deleting associated group id: ${associatedGroupId}`)
  const groupRef = db.collection(Game.COLLECTION_PATH)
    .doc(gameId)
    .collection(Group.COLLECTION_PATH)
    .doc(associatedGroupId);
  await groupRef.listCollections().then(async (collections: any) => {
    for (const collection of collections) {
      await GeneralUtils.deleteCollection(db, collection)
    }
    await groupRef.delete()
  });
})

/*******************************************************
* Util functions
********************************************************/

function trimmedString(rawText: any): string {
  if (!(typeof rawText === 'string')) {
    throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }
  return rawText.trim();
}

function trimAndEnforceNoEmoji(rawText: any): string {
  if (!(typeof rawText === 'string')) {
    throw new functions.https.HttpsError('invalid-argument', "Expected value to be type String.");
  }
  let trimmed = rawText.trim()
  trimmed = trimmed.replace(/\W/g, '') // remove all non alphanumeric chars
  return trimmed;
}

/*******************************************************
* REWARD functions
********************************************************/

exports.createReward = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const shortName = trimAndEnforceNoEmoji(data.shortName);
  const longName = data.longName;
  const description = data.description;
  const imageUrl = data.imageUrl;
  const points = data.points;
  GeneralUtils.verifyStringArgs([gameId, shortName])
  GeneralUtils.verifyOptionalStringArgs([longName, description, imageUrl])
  GeneralUtils.verifyNumberArgs([points])
  await RewardImpl.createReward(db, gameId, shortName, longName, description, imageUrl, points)
});

exports.updateReward = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const rewardId = data.rewardId;
  const longName = data.longName;
  const description = data.description;
  const imageUrl = data.imageUrl;
  const points = data.points;
  GeneralUtils.verifyStringArgs([gameId, rewardId])
  GeneralUtils.verifyOptionalStringArgs([longName, description, imageUrl])
  GeneralUtils.verifyNumberArgs([points])
  await RewardImpl.updateReward(db, gameId, rewardId, longName, description, imageUrl, points)
});

// TODO: Add delete reward (from game & from player), recalc points on delete

exports.generateClaimCodes = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const rewardId = data.rewardId;
  const numCodes = data.numCodes;
  GeneralUtils.verifyStringArgs([gameId, rewardId])
  GeneralUtils.verifyNumberArgs([numCodes])
  await RewardImpl.generateClaimCodes(db, gameId, rewardId, numCodes)
});


exports.getRewardClaimedStats = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const rewardId = data.rewardId;
  GeneralUtils.verifyStringArgs([gameId, rewardId])
  return await RewardImpl.getRewardClaimedStats(db, gameId, rewardId)
});


exports.getAvailableClaimCodes = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const rewardId = data.rewardId;
  GeneralUtils.verifyStringArgs([gameId, rewardId])
  return await RewardImpl.getAvailableClaimCodes(db, gameId, rewardId)
});


exports.redeemRewardCode = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  const playerId = data.playerId
  const claimCode = GeneralUtils.normalizeLifeCode(data.claimCode);
  GeneralUtils.verifyStringArgs([gameId, playerId, claimCode])
  await RewardImpl.redeemRewardCode(db, gameId, playerId, claimCode)
});


exports.getRewardsByName = functions.https.onCall(async (data, context) => {
  GeneralUtils.verifySignedIn(context)
  const gameId = data.gameId;
  GeneralUtils.verifyStringArgs([gameId])
  return await RewardImpl.getRewardsByName(db, gameId)
});


/*******************************************************
* QUIZ QUESTION functions
********************************************************/

/**
 * Initiate a recursive delete of documents at a given path.
 *
 * The calling user must be authenticated and have the custom "admin" attribute
 * set to true on the auth token.
 *
 * This delete is NOT an atomic operation and it's possible
 * that it may fail after only deleting some documents.
 *
 * @param {string} data.path the document or collection path to delete.
 */
exports.deleteQuizQuestion = functions.runWith({
    timeoutSeconds: 540,
    memory: '2GB'
}).https.onCall(async (data, context) => {
    GeneralUtils.verifyIsAdmin(context)
    const gameId = data.gameId;
    const questionId = data.questionId;
    console.log(
      `User ${context.auth!.uid} has requested to delete question ${questionId}`
    );

    // Run a recursive delete on the quiz document path.
    const questionRef = db.collection(Game.COLLECTION_PATH)
      .doc(gameId)
      .collection(QuizQuestion.COLLECTION_PATH)
      .doc(questionId);
    await questionRef.listCollections().then(async (collections: any) => {
      for (const collection of collections) {
        await GeneralUtils.deleteCollection(db, collection)
      }
      await questionRef.delete()
    });
});
