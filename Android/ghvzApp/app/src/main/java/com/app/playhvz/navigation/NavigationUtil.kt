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

package com.app.playhvz.navigation

import androidx.fragment.app.FragmentActivity
import androidx.navigation.NavController
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.screens.chat.ChatListFragmentDirections
import com.app.playhvz.screens.gamedashboard.GameDashboardFragmentDirections
import com.app.playhvz.screens.gamelist.GameListFragmentDirections
import com.app.playhvz.screens.gamesettings.GameSettingsFragmentDirections
import com.app.playhvz.screens.player.ProfileFragmentDirections

class NavigationUtil {
    companion object {
        /**
         * Opens the home page for the game. This does NOT overwrite the saved game id in shared
         * preferences.
         */
        fun navigateToGameDashboard(navController: NavController, gameId: String?) {
            navController.navigate(
                GameDashboardFragmentDirections.actionGlobalNavGameDashboardFragment(gameId)
            )
        }

        /** Opens the create game flow (aka the game setting screen with no game id). */
        fun navigateToCreateGame(navController: NavController) {
            navigateToGameSettings(navController, null)
        }

        /** Opens the profile page for the given user, or current User's profile page if no player Id. */
        fun navigateToPlayerProfile(
            navController: NavController,
            gameId: String?,
            playerId: String?
        ) {
            navController.navigate(
                ProfileFragmentDirections.actionGlobalNavPlayerProfileFragment(
                    gameId,
                    playerId
                )
            )
        }

        /**
         * Navigates to the game setting page for the provided gameId. Does NOT overwrite the saved
         * game id in shared preferences. Passing a null game id will open the "Create Game" flow.
         */
        fun navigateToGameSettings(navController: NavController, gameId: String?) {
            navController.navigate(
                GameSettingsFragmentDirections.actionGlobalNavGameSettingsFragment(gameId)
            )
        }

        /** Clears the saved game id and opens the game list. */
        fun navigateToGameList(navController: NavController, activity: FragmentActivity) {
            val editor =
                activity.getSharedPreferences(SharedPreferencesConstants.PREFS_FILENAME, 0)!!.edit()
            editor.putString(SharedPreferencesConstants.CURRENT_GAME_ID, null)
            editor.apply()
            navController.navigate(GameListFragmentDirections.actionGlobalNavGameListFragment())
        }

        /**
         * Opens the chatroom.
         */
        fun navigateToChatList(navController: NavController) {
            navController.navigate(
                ChatListFragmentDirections.actionGlobalNavChatListFragment()
            )
        }

    }
}