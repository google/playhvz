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

package com.app.playhvz.firebase.viewmodels

import android.util.Log
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LiveData
import androidx.lifecycle.ViewModel
import com.app.playhvz.app.HvzData
import com.app.playhvz.firebase.classmodels.Reward
import com.app.playhvz.firebase.operations.RewardDatabaseOperations
import com.app.playhvz.firebase.utils.DataConverterUtil
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.EventListener

class PlayerRewardViewModel : ViewModel() {
    companion object {
        private val TAG = PlayerRewardViewModel::class.qualifiedName
    }

    private var rewardIdList: HvzData<Map<String, Int>> = HvzData(mapOf())
    private var rewardList: HvzData<Map<String, Pair<Reward?, Int>>> = HvzData(mapOf())


    /** Listens to a player's reward updates and returns a LiveData object. */
    fun getPlayersRewards(
        lifecycleOwner: LifecycleOwner,
        gameId: String,
        updatedRewardIdMap: Map<String, Int>
    ): LiveData<Map<String, Pair<Reward?, Int>>> {
        if (!rewardIdList.hasObservers()) {
            // Listen to updates to the list of rewards we should observe
            rewardIdList.observe(
                lifecycleOwner,
                androidx.lifecycle.Observer { updatedRewardIds ->
                    observeRewards(gameId, updatedRewardIds)
                })
        }

        // Diff and update the list of rewards we should observe based on the updated list.
        if (rewardIdList.value != null) {
            // Remove reward listeners for rewards the user doesn't have anymore.
            val removedRewards =
                rewardIdList.value!!.keys.toSet().minus(updatedRewardIdMap.keys.toSet())
            stopListening(removedRewards)
        }
        rewardIdList.value = updatedRewardIdMap
        return rewardList
    }

    /** Listens to updates on every chat room the player is a member of. */
    private fun observeRewards(
        gameId: String,
        updatedRewardIdList: Map<String, Int>
    ) {
        for ((rewardId, count) in updatedRewardIdList) {
            // Check if count updated.
            if (rewardList.value != null && count != rewardList.value!![rewardId]?.second) {
                val updatedRewardList = rewardList.value!!.toMutableMap()
                updatedRewardList[rewardId] = Pair(updatedRewardList[rewardId]?.first, count)
                rewardList.value = updatedRewardList
            }

            // Listen to reward document updates.
            if (rewardId in rewardList.docIdListeners) {
                // We're already listening to this reward
                continue
            }
            rewardList.docIdListeners[rewardId] =
                RewardDatabaseOperations.getRewardDocumentReference(gameId, rewardId)
                    .addSnapshotListener(
                        EventListener<DocumentSnapshot> { snapshot, e ->
                            if (e != null) {
                                Log.w(TAG, "Reward listen failed. ", e)
                                return@EventListener
                            }
                            if (snapshot == null || !snapshot.exists()) {
                                val updatedRewardList = rewardList.value!!.toMutableMap()
                                updatedRewardList.remove(rewardId)
                                rewardList.value = updatedRewardList
                                stopListening(setOf(rewardId))
                                return@EventListener
                            }
                            val updatedReward =
                                DataConverterUtil.convertSnapshotToReward(snapshot)
                            val updatedRewardList = rewardList.value!!.toMutableMap()
                            updatedRewardList[rewardId] = Pair(updatedReward, count)
                            rewardList.value = updatedRewardList
                        })
        }
    }

    private fun stopListening(removedIds: Set<String>) {
        for (removedId in removedIds) {
            if (!rewardList.docIdListeners.containsKey(removedId)) {
                continue
            }
            rewardList.docIdListeners[removedId]?.remove()
            rewardList.docIdListeners.remove(removedId)
        }
    }
}