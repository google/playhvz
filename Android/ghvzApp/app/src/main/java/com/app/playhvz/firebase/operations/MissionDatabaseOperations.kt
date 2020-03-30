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

import com.app.playhvz.firebase.constants.MissionPath
import com.app.playhvz.firebase.constants.MissionPath.Companion.MISSION_BY_GROUP_QUERY
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.firebase.utils.FirebaseDatabaseUtil
import com.google.android.gms.tasks.OnSuccessListener
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.Query
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MissionDatabaseOperations {
    companion object {
        private val TAG = MissionDatabaseOperations::class.qualifiedName

        /** Returns a document reference to the given missionId. */
        fun getMissionDocumentReference(
            gameId: String,
            missionId: String
        ): DocumentReference {
            return MissionPath.MISSION_DOCUMENT_REFERENCE(gameId, missionId)
        }

        fun getMissionDocument(
            gameId: String,
            missionId: String,
            onSuccessListener: OnSuccessListener<DocumentSnapshot>
        ) {
            FirebaseDatabaseUtil.optimizedGet(
                MissionPath.MISSION_DOCUMENT_REFERENCE(
                    gameId,
                    missionId
                ), onSuccessListener
            )
        }

        /** Create Mission. */
        suspend fun asyncCreateMission(
            gameId: String,
            missionName: String,
            missionDetails: String,
            startTime: Long,
            endTime: Long,
            allegianceFilter: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "name" to missionName,
                "details" to missionDetails,
                "startTime" to startTime,
                "endTime" to endTime,
                "allegianceFilter" to allegianceFilter
            )

            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("createMission")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

        /** Create Mission. */
        suspend fun asyncUpdateMission(
            gameId: String,
            missionId: String,
            missionName: String,
            missionDetails: String,
            startTime: Long,
            endTime: Long,
            allegianceFilter: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "missionId" to missionId,
                "name" to missionName,
                "details" to missionDetails,
                "startTime" to startTime,
                "endTime" to endTime,
                "allegianceFilter" to allegianceFilter
            )

            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("updateMission")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

        /** Returns a query for all the missions in a given game. */
        fun getGroupsAssociatedWithMissons(gameId: String): Query {
            return MissionPath.MISSION_COLLECTION(gameId)
        }

        /** Returns a query for missions associated with the given group ids. */
        fun getMissionsAssociatedWithGroups(gameId: String, groupIds: List<String>): Query {
            return MISSION_BY_GROUP_QUERY(gameId, groupIds)
        }

        /** Permanently deletes mission. */
        suspend fun asyncDeleteMission(
            gameId: String,
            missionId: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "missionId" to missionId
            )
            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("deleteMission")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }
    }
}