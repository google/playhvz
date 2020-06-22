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
import com.app.playhvz.firebase.constants.ChatPath
import com.app.playhvz.firebase.constants.RewardPath
import com.app.playhvz.firebase.utils.FirebaseDatabaseUtil
import com.google.android.gms.tasks.OnSuccessListener
import com.google.firebase.firestore.CollectionReference
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.DocumentSnapshot
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class RewardDatabaseOperations {
    companion object {
        private val TAG = RewardDatabaseOperations::class.qualifiedName

        /** Returns a collection reference to the given chatRoomId. */
        fun getRewardCollectionReference(
            gameId: String
        ): CollectionReference {
            return RewardPath.REWARD_COLLECTION(gameId)
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
            RewardPath.REWARD_COLLECTION(gameId).add(
                Reward.createFirebaseObject(rewardDraft)
            ).addOnSuccessListener {
                successListener.invoke()
            }.addOnFailureListener {
                Log.e(TAG, "Failed to create reward: " + it)
                failureListener.invoke()
            }
        }

        /** Update Reward. */
        suspend fun asyncUpdateReward(
            gameId: String,
            rewardId: String,
            rewardDraft: Reward,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            RewardPath.REWARD_DOCUMENT_REFERENCE(gameId, rewardId).set(
                Reward.createFirebaseObject(rewardDraft)
            ).addOnSuccessListener {
                successListener.invoke()
            }.addOnFailureListener {
                Log.e(TAG, "Failed to update reward: " + it)
                failureListener.invoke()
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