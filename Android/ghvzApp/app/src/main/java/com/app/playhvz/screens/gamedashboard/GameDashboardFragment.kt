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

package com.app.playhvz.screens.gamedashboard

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import com.app.playhvz.R
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.firebase.viewmodels.MissionListViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.screens.gamedashboard.cards.DeclareAllegianceCard
import com.app.playhvz.screens.gamedashboard.cards.InfectCard
import com.app.playhvz.screens.gamedashboard.cards.LifeCodeCard
import com.app.playhvz.screens.gamedashboard.cards.MissionCard
import com.app.playhvz.utils.PlayerUtils
import com.app.playhvz.utils.SystemUtils

/** Fragment for showing a list of Games the user is registered for.*/
class GameDashboardFragment : Fragment() {
    companion object {
        private val TAG = GameDashboardFragment::class.qualifiedName
    }

    private lateinit var firestoreViewModel: GameViewModel
    private lateinit var missionViewModel: MissionListViewModel
    private lateinit var declareAllegianceCard: DeclareAllegianceCard
    private lateinit var infectCard: InfectCard
    private lateinit var lifeCodeCard: LifeCodeCard
    private lateinit var missionCard: MissionCard

    var gameId: String? = null
    var playerId: String? = null
    var game: Game? = null
    var player: Player? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        firestoreViewModel = ViewModelProvider(requireActivity()).get(GameViewModel::class.java)
        missionViewModel = ViewModelProvider(requireActivity()).get(MissionListViewModel::class.java)

        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_GAME_ID, null)
        playerId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_PLAYER_ID, null)

        if (gameId == null || playerId == null) {
            SystemUtils.clearSharedPrefs(requireActivity())
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
        }


    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        setupObservers()
        setupCards()
        val view = inflater.inflate(R.layout.fragment_game_dashboard, container, false)
        declareAllegianceCard.onCreateView(view)
        infectCard.onCreateView(view)
        lifeCodeCard.onCreateView(view)
        missionCard.onCreateView(view)
        setupToolbar()
        return view
    }

    fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        if (toolbar != null) {
            toolbar.title =
                if (game == null || game?.name.isNullOrEmpty()) requireContext().getString(R.string.app_name)
                else game?.name
            toolbar.setDisplayHomeAsUpEnabled(true)
        }
    }

    private fun setupObservers() {
        if (gameId == null || playerId == null) {
            return
        }
        val failureListener = {
            try {
                NavigationUtil.navigateToGameList(findNavController(), requireActivity())
            } catch (e: IllegalStateException) {
                // This means the user signed out and we can't find the nav controller because the
                // main activity died and we're showing the sign-in activity instead.
                // Do nothing because the right activity is already showing.
            }
        }
        firestoreViewModel.getGame(gameId!!, failureListener)
            .observe(viewLifecycleOwner, androidx.lifecycle.Observer { serverGame: Game ->
                updateGame(serverGame)
            })
        PlayerUtils.getPlayer(gameId!!, playerId!!)
            .observe(viewLifecycleOwner, androidx.lifecycle.Observer { serverPlayer ->
                updatePlayer(serverPlayer)
            })
        missionViewModel.getLatestMissionPlayerIsIn(this, gameId!!, playerId!!)
            .observe(viewLifecycleOwner, androidx.lifecycle.Observer { missionMap ->
                if (missionMap.isEmpty()) {
                    missionCard.hide()
                    return@Observer
                }
                missionCard.show()
                // Always hide the admin options on the game dashboard fragment.
                missionCard.onBind(missionMap.values.first()!!, /* isAdmin= */false)
            })
    }

    private fun setupCards() {
        declareAllegianceCard = DeclareAllegianceCard(this, gameId!!, playerId!!)
        infectCard = InfectCard(this, gameId!!, playerId!!)
        lifeCodeCard = LifeCodeCard(this, gameId!!, playerId!!)
        missionCard = MissionCard(this, findNavController(), gameId!!, playerId!!)
    }

    private fun updateGame(serverGame: Game?) {
        game = serverGame
        setupToolbar()
    }

    private fun updatePlayer(serverPlayer: Player?) {
        if (serverPlayer == null) {
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
        }
        declareAllegianceCard.onPlayerUpdated(serverPlayer!!)
        infectCard.onPlayerUpdated(serverPlayer)
        lifeCodeCard.onPlayerUpdated(serverPlayer)
    }
}