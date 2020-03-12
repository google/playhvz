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

package com.app.playhvz.screens.declareallegiance

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
import com.app.playhvz.common.globals.CrossClientConstants.Companion.HUMAN
import com.app.playhvz.common.globals.CrossClientConstants.Companion.ZOMBIE
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.operations.PlayerDatabaseOperations
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.utils.PlayerUtils
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.runBlocking

/** Fragment for showing a list of Games the user is registered for.*/
class DeclareAllegianceFragment : Fragment() {
    companion object {
        private val TAG = DeclareAllegianceFragment::class.qualifiedName
    }

    lateinit var firestoreViewModel: GameViewModel

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
        val view = inflater.inflate(R.layout.fragment_declare_allegiance, container, false)
        view.findViewById<MaterialButton>(R.id.declare_human_button).setOnClickListener {
            setAllegiance(HUMAN)
            NavigationUtil.navigateToGameDashboard(findNavController(), gameId)
        }
        view.findViewById<MaterialButton>(R.id.declare_zombie_button).setOnClickListener {
            setAllegiance(ZOMBIE)
            NavigationUtil.navigateToGameDashboard(findNavController(), gameId)
        }
        return view
    }

    private fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        if (toolbar != null) {
            toolbar.title = getString(R.string.declare_allegiance_card_title)
            toolbar.setDisplayHomeAsUpEnabled(true)
        }
    }

    private fun setupObservers() {
        if (gameId == null || playerId == null) {
            return
        }
        PlayerUtils.getPlayer(gameId!!, playerId!!)
            .observe(this, androidx.lifecycle.Observer { serverPlayer ->
                player = serverPlayer
            })
    }

    private fun setAllegiance(allegiance: String) {
        runBlocking {
            EspressoIdlingResource.increment()
            PlayerDatabaseOperations.setPlayerAllegiance(gameId!!, playerId!!, allegiance, {}, {})
            EspressoIdlingResource.decrement()
        }
    }
}