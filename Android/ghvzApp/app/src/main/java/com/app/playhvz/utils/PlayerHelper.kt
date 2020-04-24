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

package com.app.playhvz.utils

import android.util.Log
import com.app.playhvz.app.HvzData
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.constants.PlayerPath
import com.app.playhvz.firebase.utils.DataConverterUtil


/** Class for managing player listeners. */
class PlayerHelper {
    companion object {
        val TAG = PlayerHelper::class.qualifiedName
    }

    private val playerList: HvzData<Map<String, Player>> = HvzData(mapOf())

    /** Returns a list of Player LiveData objects, internally handles cleaning up firebase listeners. */
    fun getListOfPlayers(gameId: String, playerIdList: List<String>): HvzData<Map<String, Player>> {
        // Remove listeners for any players that were removed from the list.
        val removedIds = playerList.value!!.keys.toSet().minus(playerIdList.toSet())
        stopListening(playerList, removedIds)
        if (removedIds.isNotEmpty() && playerList.value!!.isNotEmpty()) {
            val mutableList = playerList.value!!.toMutableMap()
            removedIds.map { key -> mutableList.remove(key) }
            playerList.value = mutableList
        }

        for (id in playerIdList) {
            if (id in playerList.docIdListeners) {
                // We're already listening to this player
                continue
            }
            playerList.docIdListeners[id] =
                PlayerPath.PLAYERS_COLLECTION(gameId).document(id)
                    .addSnapshotListener { snapshot, e ->
                        if (e != null) {
                            Log.w(TAG, "Listen failed.", e)
                            return@addSnapshotListener
                        }
                        if (snapshot != null && snapshot.exists()) {
                            val updatedPlayer = DataConverterUtil.convertSnapshotToPlayer(snapshot)
                            val updatedPlayerList = playerList.value!!.toMutableMap()
                            updatedPlayerList[id] = updatedPlayer
                            playerList.value = updatedPlayerList
                        }
                    }
        }
        return playerList
    }

    private fun stopListening(liveData: HvzData<*>, removedIds: Set<String>) {
        for (removedId in removedIds) {
            if (!liveData.docIdListeners.containsKey(removedId)) {
                continue
            }
            liveData.docIdListeners[removedId]?.remove()
            liveData.docIdListeners.remove(removedId)
        }
    }
}