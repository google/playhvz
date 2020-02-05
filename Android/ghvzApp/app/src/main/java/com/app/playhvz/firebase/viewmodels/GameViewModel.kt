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
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.constants.GamePath
import com.app.playhvz.firebase.utils.DataConverterUtil

class GameViewModel : ViewModel() {
    companion object {
        private val TAG = GameViewModel::class.qualifiedName
    }

    private var game: HvzData<Game> = HvzData()

    /** Returns a Game LiveData object for the given id. */
    fun getGame(gameId: String): LiveData<Game> {
        val listener = GamePath.GAMES_COLLECTION.document(gameId)
            .addSnapshotListener { snapshot, e ->
                if (e != null) {
                    Log.w(TAG, "Listen failed.", e)
                    return@addSnapshotListener
                }
                if (snapshot != null && snapshot.exists()) {
                    game.value = DataConverterUtil.convertSnapshotToGame(snapshot)
                }
            }
        game.onDestroyed = {
            listener.remove()
        }
        return game
    }

    /** Returns the latest LiveData object we requested. */
    fun getGame(): MutableLiveData<Game>? {
        return if (game.value != null) game else null
    }
}