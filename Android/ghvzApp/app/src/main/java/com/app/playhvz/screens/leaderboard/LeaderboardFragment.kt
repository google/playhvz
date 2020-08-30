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

package com.app.playhvz.screens.leaderboard

import android.os.Bundle
import android.view.*
import android.widget.ProgressBar
import androidx.appcompat.app.ActionBar
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.app.playhvz.R
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.navigation.NavigationUtil

class LeaderboardFragment : Fragment() {
    companion object {
        private val TAG = LeaderboardFragment::class.qualifiedName
    }

    private var gameId: String? = null

    private lateinit var gameViewModel: GameViewModel
    private lateinit var progressBar: ProgressBar
    private lateinit var toolbar: ActionBar
    private lateinit var toolbarMenu: Menu

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        toolbar = (activity as AppCompatActivity).supportActionBar!!
        gameViewModel = GameViewModel()

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
        val view = inflater.inflate(R.layout.fragment_leaderboard, container, false)
        progressBar = view.findViewById(R.id.progress_bar)
        return view
    }

    fun setupToolbar() {
        toolbar.title = getString(R.string.navigation_drawer_leaderboard)
        setHasOptionsMenu(true)
    }

    override fun onCreateOptionsMenu(menu: Menu, inflater: MenuInflater) {
        inflater.inflate(R.menu.menu_filter_list, menu)
        toolbarMenu = menu
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == R.id.filter_option) {
            // TODO: filter view
        }
        return super.onOptionsItemSelected(item)
    }

}