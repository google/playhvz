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

import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.firebase.operations.GameDatabaseOperations
import com.app.playhvz.navigation.NavigationUtil
import kotlinx.coroutines.runBlocking

class GameUtils {
    companion object {
        val TAG = GameUtils::class.qualifiedName

        /** Returns whether the current player is a game admin or not. */
        @Deprecated("Use GameViewModel.getGameAndAdminObserver() instead")
        private fun isAdmin(game: Game): Boolean {
            return game.creatorUserId == FirebaseProvider.getFirebaseAuth().uid
        }

        fun openGameDashboard(fragment: Fragment, gameId: String) {
            val editor =
                fragment.activity?.getSharedPreferences(
                    SharedPreferencesConstants.PREFS_FILENAME,
                    0
                )!!.edit()
            editor.putString(SharedPreferencesConstants.CURRENT_GAME_ID, gameId)
            editor.apply()
            runBlocking {
                GameDatabaseOperations.getPlayerIdForGame(gameId, editor) {
                    NavigationUtil.navigateToGameDashboard(fragment.findNavController(), gameId)
                }
            }
        }
    }
}