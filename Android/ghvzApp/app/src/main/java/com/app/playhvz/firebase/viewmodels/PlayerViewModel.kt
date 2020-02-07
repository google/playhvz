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
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.app.playhvz.app.HvzData
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.constants.PathConstants.Companion.UNIVERSAL_FIELD__USER_ID
import com.app.playhvz.firebase.constants.PlayerPath
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.firebase.utils.DataConverterUtil

class PlayerViewModel : ViewModel() {
    companion object {
        private val TAG = PlayerViewModel::class.qualifiedName
    }

    private var player: HvzData<Player> = HvzData()

    /** Returns a Player LiveData object for the given id. */
    fun getPlayer(gameId: String, playerId: String): LiveData<Player> {
        player.value = Player()
        player.docIdListeners[playerId] = PlayerPath.PLAYERS_COLLECTION(gameId).document(playerId)
            .addSnapshotListener { snapshot, e ->
                if (e != null) {
                    Log.w(TAG, "Listen failed.", e)
                    return@addSnapshotListener
                }
                if (snapshot != null && snapshot.exists()) {
                    player.value = DataConverterUtil.convertSnapshotToPlayer(snapshot)

                }
            }
        return player
    }

    /** Returns a Player LiveData object for the current user id. */
    @Suppress("LABEL_NAME_CLASH")
    fun getPlayer(gameId: String): MutableLiveData<Player> {
        val playerId = FirebaseProvider.getFirebaseAuth().uid
        if (playerId.isNullOrEmpty()) {
            Log.w(TAG, "Player Id was empty and shouldn't be, not listening to data updates.")
            return player
        }
        player.docIdListeners["query"] = PlayerPath.PLAYERS_COLLECTION(gameId)
            .whereEqualTo(UNIVERSAL_FIELD__USER_ID, playerId)
            .addSnapshotListener { snapshot, e ->
                if (e != null) {
                    Log.w(TAG, "Listen failed.", e)
                    return@addSnapshotListener
                }
                if (snapshot != null && snapshot.size() == 1) {
                    updatePlayerData(DataConverterUtil.convertSnapshotToPlayer(snapshot.documents[0]!!))
                }
            }
        return player
    }

    /** Returns the latest LiveData object we requested. */
    fun getPlayer(): MutableLiveData<Player>? {
        return if (player.value != null) player else null
    }

    private fun updatePlayerData(updatedPlayer: Player) {
        player.value = updatedPlayer
    }
}