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

package com.app.playhvz.screens.gamestats

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.ActionBar
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Stat
import com.app.playhvz.firebase.operations.GameDatabaseOperations
import com.app.playhvz.navigation.NavigationUtil
import kotlinx.coroutines.runBlocking

class GameStatsFragment : Fragment() {
    companion object {
        private val TAG = GameStatsFragment::class.qualifiedName
    }

    private var gameId: String? = null

    private lateinit var debugText: TextView
    private lateinit var errorLabel: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var toolbar: ActionBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        toolbar = (activity as AppCompatActivity).supportActionBar!!
        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_GAME_ID, null)
        if (gameId == null) {
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
        }
        setupToolbar()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_game_stats, container, false)
        progressBar = view.findViewById(R.id.progress_bar)
        errorLabel = view.findViewById(R.id.error_label)
        debugText = view.findViewById(R.id.debug_text)

        val onSuccess = { stats: Stat ->
            EspressoIdlingResource.decrement()
            progressBar.visibility = View.GONE
            errorLabel.visibility = View.GONE
            displayStats(stats)
        }
        val onFail = {
            EspressoIdlingResource.decrement()
            errorLabel.visibility = View.VISIBLE
            progressBar.visibility = View.GONE
        }
        progressBar.visibility = View.VISIBLE
        runBlocking {
            EspressoIdlingResource.increment()
            GameDatabaseOperations.asyncGetGameStats(gameId!!, onSuccess, onFail)
        }
        return view
    }

    fun setupToolbar() {
        toolbar.title = getString(R.string.navigation_drawer_game_stats)
    }

    private fun displayStats(stats: Stat) {
        val statsAsString = "currentHumanCount: " + stats.currentHumanCount +
                " currentZombieCount: " + stats.currentZombieCount +
                " starterZombieCount: " + stats.starterZombieCount
        debugText.text = statsAsString
        debugText.invalidate()
        debugText.requestLayout()
        debugText.visibility = View.VISIBLE
    }
}