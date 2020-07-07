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
import com.app.playhvz.screens.chatlist.AdminChatListFragmentDirections
import com.app.playhvz.screens.chatlist.ChatListFragmentDirections
import com.app.playhvz.screens.chatroom.ChatRoomFragmentDirections
import com.app.playhvz.screens.chatroom.chatinfo.ChatInfoFragmentDirections
import com.app.playhvz.screens.declareallegiance.DeclareAllegianceFragmentDirections
import com.app.playhvz.screens.gamedashboard.GameDashboardFragmentDirections
import com.app.playhvz.screens.gamelist.GameListFragmentDirections
import com.app.playhvz.screens.gamesettings.GameSettingsFragmentDirections
import com.app.playhvz.screens.missions.MissionDashboardFragmentDirections
import com.app.playhvz.screens.missions.missionsettings.MissionSettingsFragmentDirections
import com.app.playhvz.screens.player.ProfileFragmentDirections
import com.app.playhvz.screens.quiz.QuizDashboardFragmentDirections
import com.app.playhvz.screens.quiz.questions.InfoQuestionFragmentDirections
import com.app.playhvz.screens.redeemcode.RedeemCodeFragment
import com.app.playhvz.screens.redeemcode.RedeemCodeFragmentDirections
import com.app.playhvz.screens.rewards.RewardDashboardFragmentDirections
import com.app.playhvz.screens.rewards.rewardsettings.RewardSettingsFragmentDirections
import com.app.playhvz.screens.rules_faq.CollapsibleListFragment
import com.app.playhvz.screens.rules_faq.CollapsibleListFragmentDirections

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
            editor.putString(SharedPreferencesConstants.CURRENT_PLAYER_ID, null)
            editor.apply()
            navController.navigate(GameListFragmentDirections.actionGlobalNavGameListFragment())
        }

        /**
         * Opens a list of chat rooms.
         */
        fun navigateToChatList(navController: NavController) {
            navController.navigate(
                ChatListFragmentDirections.actionGlobalNavChatListFragment()
            )
        }

        /**
         * Opens list of admin chat rooms.
         */
        fun navigateToAdminChatList(navController: NavController) {
            navController.navigate(
                AdminChatListFragmentDirections.actionGlobalNavAdminChatListFragment()
            )
        }

        /**
         * Opens the chat room.
         */
        fun navigateToChatRoom(navController: NavController, chatRoomId: String, playerId: String) {
            navController.navigate(
                ChatRoomFragmentDirections.actionGlobalNavChatRoomFragment(chatRoomId, playerId)
            )
        }

        /**
         * Opens the chat's info screen.
         */
        fun navigateToChatInfo(
            navController: NavController,
            chatRoomId: String,
            playerId: String,
            isChatWithAdmins: Boolean
        ) {
            navController.navigate(
                ChatInfoFragmentDirections.actionGlobalNavChatInfoFragment(
                    chatRoomId,
                    playerId,
                    isChatWithAdmins
                )
            )
        }

        /**
         * Opens a quiz for declaring allegiance.
         */
        fun navigateToDeclareAllegiance(navController: NavController) {
            navController.navigate(
                DeclareAllegianceFragmentDirections.actionGlobalNavDeclareAllegianceFragment()
            )
        }

        /**
         * Opens the list of missions.
         */
        fun navigateToMissionDashboard(navController: NavController) {
            navController.navigate(
                MissionDashboardFragmentDirections.actionGlobalNavMissionDashboardFragment()
            )
        }

        /**
         * Navigates to the mission setting page for the provided missionId. Passing a null mission
         * id will open the "Create Mission" flow.
         */
        fun navigateToMissionSettings(navController: NavController, missionId: String?) {
            navController.navigate(
                MissionSettingsFragmentDirections.actionGlobalNavMissionSettingsFragment(missionId)
            )
        }

        /**
         * Opens the rules of the game.
         */
        fun navigateToRules(navController: NavController) {
            navController.navigate(
                CollapsibleListFragmentDirections.actionGlobalNavRulesFragment(
                    CollapsibleListFragment.CollapsibleFragmentType.RULES
                )
            )
        }

        /**
         * Opens the FAQ of the game.
         */
        fun navigateToFaq(navController: NavController) {
            navController.navigate(
                CollapsibleListFragmentDirections.actionGlobalNavRulesFragment(
                    CollapsibleListFragment.CollapsibleFragmentType.FAQ
                )
            )
        }

        /**
         * Opens reward dashboard.
         */
        fun navigateToRewardDashboard(navController: NavController) {
            navController.navigate(
                RewardDashboardFragmentDirections.actionGlobalNavRewardDashboardFragment()
            )
        }

        /**
         * Opens quiz dashboard.
         */
        fun navigateToQuizDashboard(navController: NavController) {
            navController.navigate(
                QuizDashboardFragmentDirections.actionGlobalNavQuizDashboardFragment()
            )
        }

        /**
         * Opens quiz info question.
         */
        fun navigateToQuizInfoQuestion(navController: NavController) {
            navController.navigate(
                InfoQuestionFragmentDirections.actionGlobalNavQuizQuestionInfoFragment()
            )
        }

        /**
         * Navigates to the mission setting page for the provided missionId. Passing a null mission
         * id will open the "Create Mission" flow.
         */
        fun navigateToRewardSettings(navController: NavController, rewardId: String?) {
            navController.navigate(
                RewardSettingsFragmentDirections.actionGlobalNavRewardSettingsFragment(rewardId)
            )
        }

        /**
         * Opens the reward redemption view.
         */
        fun navigateToRedeemReward(navController: NavController) {
            navController.navigate(
                RedeemCodeFragmentDirections.actionGlobalNavRedeemLifecodeFragment(
                    RedeemCodeFragment.RedeemCodeFragmentType.REWARDCODE
                )
            )
        }

        /**
         * Opens the lifecode redemption (aka infection) view.
         */
        fun navigateToInfectPlayer(navController: NavController) {
            navController.navigate(
                RedeemCodeFragmentDirections.actionGlobalNavRedeemLifecodeFragment(
                    RedeemCodeFragment.RedeemCodeFragmentType.LIFECODE
                )
            )
        }
    }
}