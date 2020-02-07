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
import androidx.lifecycle.LiveData
import com.app.playhvz.app.HvzData
import com.app.playhvz.common.globals.CrossClientConstants.Companion.DEAD_ALLEGIANCES
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.constants.PlayerPath
import com.app.playhvz.firebase.utils.DataConverterUtil


class PlayerUtil {
    companion object {
        val TAG = PlayerUtil::class.qualifiedName

        enum class AliveStatus { ALIVE, DEAD }

        /** Returns whether the current player allegiance is considered Alive or Dead. */
        fun getAliveStatus(allegiance: String): AliveStatus {
            return if (DEAD_ALLEGIANCES.contains(allegiance)) {
                AliveStatus.DEAD
            } else {
                AliveStatus.ALIVE
            }
        }

        /** Returns a Player LiveData object for the given id. */
        fun getPlayer(gameId: String, playerId: String): LiveData<Player> {
            val player: HvzData<Player> = HvzData()
            player.value = Player()
            player.docIdListeners[playerId] =
                PlayerPath.PLAYERS_COLLECTION(gameId).document(playerId)
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
    }
}