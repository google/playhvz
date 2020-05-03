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
import com.app.playhvz.firebase.classmodels.Group
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.constants.GroupPath.Companion.GROUP_FIELD__SETTINGS_ALLEGIANCE_FILTER
import com.app.playhvz.firebase.constants.PlayerPath
import com.app.playhvz.firebase.utils.DataConverterUtil
import com.google.android.gms.tasks.OnSuccessListener
import com.google.firebase.firestore.FieldPath
import com.google.firebase.firestore.QuerySnapshot


class PlayerUtils {
    companion object {
        val TAG = PlayerUtils::class.qualifiedName

        enum class AliveStatus { ALIVE, DEAD }

        private val PAGINATION_LIMIT: Long = 25

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

        /** Returns a paginated list of Players in the game with the given filter. */
        fun getPlayerList(
            liveData: HvzData<List<Player>>,
            gameId: String,
            nameFilter: String?,
            allegianceFilter: String?
        ) {
            // Logic for filtering on start string is courtesy of:
            // https://firebase.google.com/docs/database/admin/retrieve-data#range-queries

            val updatePlayerList: OnSuccessListener<in QuerySnapshot> =
                OnSuccessListener { querySnapshot ->
                    if (querySnapshot.isEmpty || querySnapshot.documents.isEmpty()) {
                        liveData.value = listOf()
                        return@OnSuccessListener
                    }
                    val mutableList = mutableListOf<Player>()
                    for (playerSnapshot in querySnapshot.documents) {
                        mutableList.add(DataConverterUtil.convertSnapshotToPlayer(playerSnapshot))
                    }
                    liveData.value = mutableList.toList()
                }

            // Special note, due to weirdness with Firebase we must directly call .get() on the
            // chain of commands. If we create a query object and call .get() on the object then
            // the orderBy().startAt().endAt() logic fails for some reason.
            if (nameFilter.isNullOrEmpty() && allegianceFilter.isNullOrEmpty()) {
                PlayerPath.PLAYERS_COLLECTION(gameId)
                    .orderBy(PlayerPath.PLAYER_FIELD__NAME)
                    .limit(PAGINATION_LIMIT)
                    .get()
                    .addOnSuccessListener(updatePlayerList)
                return
            } else if (nameFilter.isNullOrEmpty() && !allegianceFilter.isNullOrEmpty()) {
                PlayerPath.PLAYERS_COLLECTION(gameId)
                    .whereEqualTo(GROUP_FIELD__SETTINGS_ALLEGIANCE_FILTER, allegianceFilter)
                    .orderBy(PlayerPath.PLAYER_FIELD__NAME)
                    .limit(PAGINATION_LIMIT)
                    .get()
                    .addOnSuccessListener(updatePlayerList)
                return
            } else if (!nameFilter.isNullOrEmpty() && allegianceFilter.isNullOrEmpty()) {
                PlayerPath.PLAYERS_COLLECTION(gameId)
                    .orderBy(PlayerPath.PLAYER_FIELD__NAME)
                    .startAt(nameFilter)
                    .endAt(nameFilter + "\uf8ff") // '\uf8ff' is super large char val
                    .limit(PAGINATION_LIMIT)
                    .get()
                    .addOnSuccessListener(updatePlayerList)
                return
            } else if (!nameFilter.isNullOrEmpty() && !allegianceFilter.isNullOrEmpty()) {
                PlayerPath.PLAYERS_COLLECTION(gameId)
                    .whereEqualTo(GROUP_FIELD__SETTINGS_ALLEGIANCE_FILTER, allegianceFilter)
                    .orderBy(PlayerPath.PLAYER_FIELD__NAME)
                    .startAt(nameFilter)
                    .endAt(nameFilter + "\uf8ff") // '\uf8ff' is super large char val
                    .limit(PAGINATION_LIMIT)
                    .get()
                    .addOnSuccessListener(updatePlayerList)
                return
            }
        }


        /** Returns a paginated list of Players in the game with the given filter. */
        fun getPlayerListInGroup(
            liveData: HvzData<List<Player>>,
            gameId: String,
            group: Group,
            nameFilter: String?
        ) {
            // Logic for filtering on start string is courtesy of:
            // https://firebase.google.com/docs/database/admin/retrieve-data#range-queries

            val updatePlayerList: OnSuccessListener<in QuerySnapshot> =
                OnSuccessListener { querySnapshot ->
                    if (querySnapshot.isEmpty || querySnapshot.documents.isEmpty()) {
                        liveData.value = listOf()
                        return@OnSuccessListener
                    }
                    val mutableList = mutableListOf<Player>()
                    for (playerSnapshot in querySnapshot.documents) {
                        mutableList.add(DataConverterUtil.convertSnapshotToPlayer(playerSnapshot))
                    }
                    liveData.value = mutableList.toList()
                }

            // Special note, due to weirdness with Firebase we must directly call .get() on the
            // chain of commands. If we create a query variable and call .get() on the object then
            // the orderBy().startAt().endAt() logic fails for some reason.
            PlayerPath.PLAYERS_COLLECTION(gameId)
                .whereIn(FieldPath.documentId(), group.members)
                .limit(PAGINATION_LIMIT)
                .get()
                .addOnSuccessListener(updatePlayerList)
            return
        }
    }
}