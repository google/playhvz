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
import androidx.lifecycle.LiveData
import androidx.lifecycle.ViewModel
import com.app.playhvz.app.HvzData
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.operations.LeaderboardDatabaseOperations.Companion.getPlayersByAllegianceAndScoreQuery
import com.app.playhvz.firebase.operations.LeaderboardDatabaseOperations.Companion.getPlayersByScoreQuery
import com.app.playhvz.firebase.utils.DataConverterUtil

class LeaderboardViewModel : ViewModel() {
    companion object {
        private val TAG = LeaderboardViewModel::class.qualifiedName
    }

    private var playerList: HvzData<List<Player?>> = HvzData()

    /** Returns a LiveData ordered list of players. */
    fun getLeaderboard(gameId: String, allegianceFilter: String?): LiveData<List<Player?>> {
        playerList.value = listOf()

        val query = if (allegianceFilter.isNullOrBlank()) {
            getPlayersByScoreQuery(gameId)
        } else {
            getPlayersByAllegianceAndScoreQuery(gameId, allegianceFilter!!)
        }

        query?.addSnapshotListener { querySnapshot, e ->
            if (e != null) {
                Log.w(TAG, "Listen failed ", e)
                return@addSnapshotListener
            }
            if (querySnapshot == null || querySnapshot.isEmpty) {
                playerList.value = listOf()
            }
            val players: MutableList<Player> = mutableListOf()
            for (doc in querySnapshot!!) {
                players.add(DataConverterUtil.convertSnapshotToPlayer(doc))
            }
            playerList.value = players
        }
        return playerList
    }

    // Clears out any reference to previous player data
    fun reset() {
        playerList = HvzData()
    }
}