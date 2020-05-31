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

package com.app.playhvz.firebase.operations

import android.util.Log
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.classmodels.Player.Companion.FIELD__AVATAR_URL
import com.app.playhvz.firebase.classmodels.Player.Companion.FIELD__CHAT_MEMBERSHIPS
import com.app.playhvz.firebase.classmodels.Player.Companion.FIELD__CHAT_MEMBERSHIP_ALLOW_NOTIFICATIONS
import com.app.playhvz.firebase.constants.PlayerPath
import com.app.playhvz.firebase.constants.UniversalConstants.Companion.UNIVERSAL_FIELD__USER_ID
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.Query
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class PlayerDatabaseOperations {
    companion object {
        private val TAG = PlayerDatabaseOperations::class.qualifiedName

        /** Returns a DocumentReference for a Player. */
        fun getPlayerDocumentReference(gameId: String, playerId: String): DocumentReference {
            return PlayerPath.PLAYERS_COLLECTION(gameId).document(playerId)
        }

        /** Update a player's allegiance. */
        suspend fun setPlayerAllegiance(
            gameId: String,
            playerId: String,
            allegiance: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "playerId" to playerId,
                "allegiance" to allegiance
            )

            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("changePlayerAllegiance")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Could not change allegiance: ${task.exception}")
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

        /** Update a player's allegiance. */
        suspend fun infectPlayerByLifeCode(
            gameId: String,
            infectorPlayerId: String,
            lifeCode: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "infectorPlayerId" to infectorPlayerId,
                "lifeCode" to lifeCode
            )

            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("infectPlayerByLifeCode")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Could not infect life code: ${task.exception}")
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

        /** Returns a Query listing all players in the given game that are owned by this user. */
        private fun getUsersPlayersQuery(gameId: String): Query? {
            val userId = FirebaseProvider.getFirebaseAuth().uid ?: return null
            return PlayerPath.PLAYERS_COLLECTION(gameId)
                .whereEqualTo(UNIVERSAL_FIELD__USER_ID, userId)
        }

        /** Updates the player object. */
        suspend fun asyncUpdatePlayerChatNotificationSetting(
            gameId: String?,
            playerId: String?,
            chatRoomId: String?,
            newNotificationSetting: Boolean,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            if (gameId == null || playerId == null || chatRoomId == null) {
                return@withContext
            }
            PlayerPath.PLAYERS_COLLECTION(gameId).document(playerId).update(
                "$FIELD__CHAT_MEMBERSHIPS.$chatRoomId.$FIELD__CHAT_MEMBERSHIP_ALLOW_NOTIFICATIONS",
                newNotificationSetting
            ).addOnSuccessListener {
                successListener.invoke()
            }.addOnFailureListener {
                Log.e(TAG, "Failed to update player: " + it)
                failureListener.invoke()
            }
        }

        /** Updates the player profile image. */
        suspend fun asyncUpdatePlayerProfileImage(
            gameId: String?,
            playerId: String?,
            profileImageUrl: String?,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            if (gameId == null || playerId == null || profileImageUrl == null) {
                return@withContext
            }
            PlayerPath.PLAYERS_COLLECTION(gameId).document(playerId).update(
                FIELD__AVATAR_URL,
                profileImageUrl
            ).addOnSuccessListener {
                successListener.invoke()
            }.addOnFailureListener {
                Log.e(TAG, "Failed to update player: " + it)
                failureListener.invoke()
            }
        }

    }
}