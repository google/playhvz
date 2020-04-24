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
import com.app.playhvz.firebase.constants.GroupPath
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.Query
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class GroupDatabaseOperations {
    companion object {
        private val TAG = GroupDatabaseOperations::class.qualifiedName

        /** Returns a document reference to the given groupId. */
        fun getGroupDocumentReference(
            gameId: String,
            groupId: String
        ): DocumentReference {
            return GroupPath.GROUP_DOCUMENT_REFERENCE(gameId, groupId)
        }

        /** Returns a query for groups that contain the player id. */
        fun getMissionGroupsPlayerIsIn(
            gameId: String,
            playerId: String,
            listOfGroupIdsAssociatedWithMissions: List<String>
        ): Query {
            return GroupPath.GROUP_MISSION_MEMBERSHIP_QUERY(
                gameId,
                playerId,
                listOfGroupIdsAssociatedWithMissions
            )
        }

        /** Adds a list of players to the group. */
        suspend fun asyncAddPlayersToGroup(
            gameId: String,
            playerIdList: List<String>,
            groupId: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "groupId" to groupId,
                "playerIdList" to playerIdList
            )

            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("addPlayersToGroup")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

        /** Remove player from admin group. */
        suspend fun asyncRemovePlayerFromGroup(
            gameId: String,
            playerId: String,
            groupId: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "playerId" to playerId,
                "groupId" to groupId
            )

            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("removePlayerFromGroup")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Could not remove player from group: ${task.exception}")
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

    }
}