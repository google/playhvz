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
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.app.HvzData
import com.app.playhvz.firebase.classmodels.Reward
import com.app.playhvz.firebase.operations.RewardDatabaseOperations
import com.app.playhvz.firebase.utils.DataConverterUtil
import kotlinx.coroutines.runBlocking

class RewardListViewModel : ViewModel() {
    companion object {
        private val TAG = RewardListViewModel::class.qualifiedName
    }

    private var rewardList: HvzData<List<Reward>> = HvzData(listOf())

    /** Listens to all reward updates and returns a LiveData object. */
    fun getAllRewardsInGame(
        lifecycleOwner: LifecycleOwner,
        gameId: String
    ): LiveData<List<Reward>> {
        rewardList.docIdListeners[gameId] =
            RewardDatabaseOperations.getRewardCollectionReference(gameId)
                .addSnapshotListener { querySnapshot, e ->
                    if (e != null) {
                        Log.w(TAG, "Listen to reward collection failed. ", e)
                        rewardList.value = emptyList()
                        return@addSnapshotListener
                    }
                    if (querySnapshot == null || querySnapshot.isEmpty || querySnapshot.documents.isEmpty()) {
                        rewardList.value = emptyList()
                        return@addSnapshotListener
                    }
                    val updatedList: MutableList<Reward> = mutableListOf()
                    for (rewardSnapshot in querySnapshot.documents) {
                        updatedList.add(DataConverterUtil.convertSnapshotToReward(rewardSnapshot))
                    }
                    rewardList.value = updatedList
                }
        return rewardList
    }

    /** ONE TIME gets the current count of unused claim codes. */
    fun getCurrentClaimedCount(
        gameId: String,
        rewardId: String,
        onSuccess: (rewardId: String, unusedCount: Int, total: Int) -> Unit
    ) {
        val success = { unusedCount: Int, total: Int ->
            onSuccess.invoke(rewardId, unusedCount, total)
        }
        val fail = {}
        runBlocking {
            EspressoIdlingResource.increment()
            RewardDatabaseOperations.asyncGetCurrentClaimCodeCount(gameId, rewardId, success, fail)
            EspressoIdlingResource.decrement()
        }
    }
}