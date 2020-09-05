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
import com.app.playhvz.firebase.classmodels.Reward
import com.app.playhvz.firebase.constants.RewardPath
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.firebase.utils.FirebaseDatabaseUtil
import com.google.android.gms.tasks.OnSuccessListener
import com.google.firebase.firestore.CollectionReference
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.DocumentSnapshot
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray


class RewardDatabaseOperations {
    companion object {
        private val TAG = RewardDatabaseOperations::class.qualifiedName

        /** Returns a collection reference to the given chatRoomId. */
        fun getRewardCollectionReference(
            gameId: String
        ): CollectionReference {
            return RewardPath.REWARD_COLLECTION(gameId)
        }

        /** Returns a document reference to the given rewardId. */
        fun getRewardDocumentReference(
            gameId: String,
            rewardId: String
        ): DocumentReference {
            return RewardPath.REWARD_DOCUMENT_REFERENCE(gameId, rewardId)
        }

        fun getRewardDocument(
            gameId: String,
            rewardId: String,
            onSuccessListener: OnSuccessListener<DocumentSnapshot>
        ) {
            FirebaseDatabaseUtil.optimizedGet(
                RewardPath.REWARD_DOCUMENT_REFERENCE(
                    gameId,
                    rewardId
                ), onSuccessListener
            )
        }

        /** Create Reward. */
        suspend fun asyncCreateReward(
            gameId: String,
            rewardDraft: Reward,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "shortName" to rewardDraft.shortName,
                "longName" to rewardDraft.longName,
                "description" to rewardDraft.description,
                "imageUrl" to rewardDraft.imageUrl,
                "points" to rewardDraft.points
            )
            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("createReward")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Failed to create reward: " + task.exception)
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

        /** Update Reward. */
        suspend fun asyncUpdateReward(
            gameId: String,
            rewardDraft: Reward,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "rewardId" to rewardDraft.id,
                "longName" to rewardDraft.longName,
                "description" to rewardDraft.description,
                "imageUrl" to rewardDraft.imageUrl,
                "points" to rewardDraft.points
            )
            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("updateReward")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Failed to update reward: " + task.exception)
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

        /** Generate claim codes for the reward. */
        suspend fun asyncGenerateClaimCodes(
            gameId: String,
            rewardId: String,
            numCodes: Int,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "rewardId" to rewardId,
                "numCodes" to numCodes
            )
            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("generateClaimCodes")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Failed to generate claim codes: " + task.exception)
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

        /** Generate claim codes for the reward. */
        suspend fun asyncGetCurrentClaimCodeCount(
            gameId: String,
            rewardId: String,
            successListener: (unusedCount: Int, total: Int) -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "rewardId" to rewardId
            )
            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("getRewardClaimedStats")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Failed to get claim code count: " + task.exception)
                        failureListener.invoke()
                        return@continueWith
                    }
                    if (task.result != null) {
                        val resultMap = task.result!!.data as Map<*, *>
                        val unusedCount = resultMap["unusedCount"] as Int
                        val usedCount = resultMap["usedCount"] as Int
                        successListener.invoke(unusedCount, unusedCount + usedCount)
                    }
                }
        }

        /** Gets available claim codes for the reward. */
        suspend fun asyncGetAvailableClaimCodes(
            gameId: String,
            rewardId: String,
            successListener: (codes: Array<String>) -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "rewardId" to rewardId
            )
            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("getAvailableClaimCodes")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Failed to get claim codes: " + task.exception)
                        failureListener.invoke()
                        return@continueWith
                    }
                    if (task.result != null) {
                        val claimCodes: MutableList<String> = mutableListOf()
                        try {
                            val resultMap = task.result!!.data as Map<*, *>
                            val claimCodesJsonArray = JSONArray(resultMap["claimCodes"] as String)
                            for (i in 0 until claimCodesJsonArray.length()) {
                                claimCodes.add(claimCodesJsonArray.getString(i))
                            }
                        } finally {
                            successListener.invoke(claimCodes.toTypedArray())
                        }
                    }
                }
        }

        /** Gets available rewards by name. */
        suspend fun asyncGetRewardsByName(
            gameId: String,
            successListener: (rewards: Map<String, String>) -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId
            )
            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("getRewardsByName")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Failed to get rewards by name: " + task.exception)
                        failureListener.invoke()
                        return@continueWith
                    }
                    if (task.result != null) {
                        val rewards: MutableMap<String, String> = mutableMapOf()
                        try {
                            val resultMap = task.result!!.data as Map<*, *>
                            val rewardJsonArray = JSONArray(resultMap["rewards"] as String)
                            for (i in 0 until rewardJsonArray.length()) {
                                val itemArray = rewardJsonArray.getJSONArray(i)
                                rewards[itemArray.getString(0)] = itemArray.getString(1)
                            }
                        } finally {
                            successListener.invoke(rewards)
                        }
                    }
                }
        }

        /** Redeems a given reward code. */
        suspend fun redeemClaimCode(
            gameId: String,
            playerId: String,
            claimCode: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "playerId" to playerId,
                "claimCode" to claimCode
            )

            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("redeemRewardCode")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Could not redeem reward code: ${task.exception}")
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

        /** Permanently deletes reward. */
        /* suspend fun asyncDeleteReward(
         gameId: String,
         rewardId: String,
         successListener: () -> Unit,
         failureListener: () -> Unit
     ) = withContext(Dispatchers.Default) {
         val data = hashMapOf(
             "gameId" to gameId,
             "rewardId" to rewardId
         )
         FirebaseProvider.getFirebaseFunctions()
             .getHttpsCallable("deleteReward")
             .call(data)
             .continueWith { task ->
                 if (!task.isSuccessful) {
                     failureListener.invoke()
                     return@continueWith
                 }
                 successListener.invoke()
             }
     } */
    }
}