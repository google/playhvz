package com.app.playhvz.navigation

import androidx.fragment.app.FragmentActivity
import androidx.navigation.NavController
import com.app.playhvz.common.globals.SharedPreferencesConstants
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
    }
}