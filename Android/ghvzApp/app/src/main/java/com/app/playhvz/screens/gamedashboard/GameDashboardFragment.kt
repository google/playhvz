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
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.app.debug.DebugFlags
import com.app.playhvz.common.globals.CrossClientConstants.Companion.UNDECLARED
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.operations.PlayerDatabaseOperations
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.utils.PlayerUtils
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.runBlocking

/** Fragment for showing a list of Games the user is registered for.*/
class GameDashboardFragment : Fragment() {
    companion object {
        private val TAG = GameDashboardFragment::class.qualifiedName
    }

    lateinit var firestoreViewModel: GameViewModel
    lateinit var declareAllegianceCard: MaterialCardView
    lateinit var declareButton: MaterialButton

    var gameId: String? = null
    var playerId: String? = null
    var game: Game? = null
    var player: Player? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        firestoreViewModel = ViewModelProvider(activity!!).get(GameViewModel::class.java)

        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_GAME_ID, null)
        playerId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_PLAYER_ID, null)

        setupObservers()
        setupToolbar()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_game_dashboard, container, false)

        declareAllegianceCard = view.findViewById(R.id.declare_allegiance)
        declareButton = declareAllegianceCard.findViewById(R.id.declare_button)

        return view
    }

    fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        if (toolbar != null) {
            toolbar.title =
                if (game == null || game?.name.isNullOrEmpty()) context!!.getString(R.string.app_name)
                else game?.name
            toolbar.setDisplayHomeAsUpEnabled(false)
        }
    }

    private fun setupObservers() {
        if (gameId == null || playerId == null) {
            return
        }
        firestoreViewModel.getGame(gameId!!)
            .observe(this, androidx.lifecycle.Observer { serverGame ->
                updateGame(serverGame)
            })
        PlayerUtils.getPlayer(gameId!!, playerId!!)
            .observe(this, androidx.lifecycle.Observer { serverPlayer ->
                updatePlayer(serverPlayer)
            })
    }

    private fun updateGame(serverGame: Game?) {
        game = serverGame
        setupToolbar()
    }

    private fun updatePlayer(serverPlayer: Player?) {
        if (player == null || serverPlayer == null) {
            player = serverPlayer
            handleAllegiance()
            return
        }
        val previousAllegiance = player?.allegiance
        if (previousAllegiance.equals(serverPlayer.allegiance)) {
            // Allegiance wasn't updated so we don't care what changed.
            return
        }
        player = serverPlayer
        handleAllegiance()
    }

    private fun handleAllegiance() {
        if (player?.allegiance.isNullOrEmpty()) {
            // We don't have accurate player data, don't change the current state.
            return
        }
        if (player?.allegiance != UNDECLARED) {
            // Allegiance is declared already.
            if (DebugFlags.isDevEnvironment) {
                declareButton.setText(R.string.declare_allegiance_card_button_undeclare)
                declareButton.setOnClickListener {
                    runBlocking {
                        EspressoIdlingResource.increment()
                        PlayerDatabaseOperations.setPlayerAllegiance(
                            gameId!!,
                            playerId!!,
                            UNDECLARED,
                            {},
                            {})
                        EspressoIdlingResource.decrement()
                    }
                }
            } else {
                declareAllegianceCard.visibility = View.GONE
            }
        } else {
            // Allegiance isn't declared.
            declareButton.setText(R.string.declare_allegiance_card_button)
            declareButton.setOnClickListener {
                NavigationUtil.navigateToDeclareAllegiance(findNavController())
            }
            declareAllegianceCard.visibility = View.VISIBLE
        }
    }
}