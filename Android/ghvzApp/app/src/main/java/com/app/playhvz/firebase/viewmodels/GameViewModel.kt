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
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.app.playhvz.app.HvzData
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.classmodels.Group
import com.app.playhvz.firebase.constants.GamePath
import com.app.playhvz.firebase.constants.GroupPath
import com.app.playhvz.firebase.utils.DataConverterUtil

class GameViewModel() : ViewModel() {
    companion object {
        private val TAG = GameViewModel::class.qualifiedName
    }

    class GameWithAdminStatus {
        var isAdmin: Boolean = false
        var game: Game? = null
    }

    private var game: HvzData<Game> = HvzData()
    private var gameWithAdminStatus: HvzData<GameWithAdminStatus> = HvzData()
    private var adminGroup: HvzData<Group> = HvzData()
    private var isAdmin: HvzData<Boolean> = HvzData()

    /** Returns a Game LiveData object for the given id. */
    fun getGame(gameId: String, onFailureListener: () -> Unit): LiveData<Game> {
        game.docIdListeners[gameId] = GamePath.GAMES_COLLECTION.document(gameId)
            .addSnapshotListener { snapshot, e ->
                if (e != null) {
                    Log.w(TAG, "Listen failed.", e)
                    onFailureListener.invoke()
                    return@addSnapshotListener
                }
                if (snapshot == null || !snapshot.exists()) {
                    onFailureListener.invoke()
                    return@addSnapshotListener
                }
                game.value = DataConverterUtil.convertSnapshotToGame(snapshot)
            }
        return game
    }

    /** Returns the latest LiveData object we requested. */
    fun getGame(): MutableLiveData<Game>? {
        return if (game.value != null) game else null
    }

    /** Returns a LiveData object for the given id, includes admin info. */
    fun getGameAndAdminObserver(
        lifecycleOwner: LifecycleOwner,
        gameId: String, playerId: String, onFailureListener: () -> Unit
    ): LiveData<GameWithAdminStatus> {
        game.observe(lifecycleOwner, androidx.lifecycle.Observer { updatedGame ->
            if (updatedGame == null) {
                return@Observer
            }
            observeAdminGroup(gameId, updatedGame.adminGroupId!!, playerId)
        })
        game.docIdListeners[gameId] = GamePath.GAMES_COLLECTION.document(gameId)
            .addSnapshotListener { snapshot, e ->
                if (e != null) {
                    Log.w(TAG, "Listen failed.", e)
                    onFailureListener.invoke()
                    return@addSnapshotListener
                }
                if (snapshot == null || !snapshot.exists()) {
                    onFailureListener.invoke()
                    return@addSnapshotListener
                }
                val update = GameWithAdminStatus()
                update.isAdmin = if (gameWithAdminStatus.value != null) {
                    gameWithAdminStatus.value!!.isAdmin
                } else {
                    false
                }
                update.game = DataConverterUtil.convertSnapshotToGame(snapshot)
                game.value = update.game
                gameWithAdminStatus.value = update
            }
        return gameWithAdminStatus
    }

    private fun observeAdminGroup(
        gameId: String,
        groupId: String,
        playerId: String
    ): HvzData<Group> {
        if (groupId in adminGroup.docIdListeners) {
            // We're already listening to changes on this group id.
            return adminGroup
        } else {
            stopListening()
        }
        adminGroup.docIdListeners[groupId] =
            GroupPath.GROUP_DOCUMENT_REFERENCE(gameId, groupId).addSnapshotListener { snapshot, e ->
                if (e != null) {
                    Log.w(TAG, "Listen failed.", e)
                    return@addSnapshotListener
                }
                if (snapshot == null || !snapshot.exists()) {
                    return@addSnapshotListener
                }
                val updatedGroup = DataConverterUtil.convertSnapshotToGroup(snapshot)
                val isAdmin = updatedGroup.members.contains(playerId)
                if (gameWithAdminStatus.value != null && gameWithAdminStatus.value!!.isAdmin != isAdmin) {
                    val update = GameWithAdminStatus()
                    update.isAdmin = isAdmin
                    update.game = gameWithAdminStatus.value!!.game
                    gameWithAdminStatus.value = update
                }
            }
        return adminGroup
    }

    // Clears out any reference to previous game datas
    fun reset() {
        game = HvzData()
        gameWithAdminStatus = HvzData()
        adminGroup = HvzData()
        isAdmin = HvzData()
    }

    private fun stopListening() {
        for (id in adminGroup.docIdListeners.keys) {
            adminGroup.docIdListeners[id]!!.remove()
            adminGroup.docIdListeners.remove(id)
        }
    }
}