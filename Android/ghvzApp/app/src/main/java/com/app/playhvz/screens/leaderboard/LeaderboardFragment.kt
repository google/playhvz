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
import androidx.appcompat.view.menu.ActionMenuItemView
import androidx.appcompat.widget.PopupMenu
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.app.HvzData
import com.app.playhvz.common.globals.CrossClientConstants.Companion.HUMAN
import com.app.playhvz.common.globals.CrossClientConstants.Companion.ZOMBIE
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.firebase.viewmodels.LeaderboardViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.utils.PlayerUtils

class LeaderboardFragment : Fragment() {
    companion object {
        private val TAG = LeaderboardFragment::class.qualifiedName
    }

    private var gameId: String? = null

    private lateinit var gameViewModel: GameViewModel
    private lateinit var leaderboardViewModel: LeaderboardViewModel
    private lateinit var memberRecyclerView: RecyclerView
    private lateinit var memberAdapter: MemberAdapter
    private lateinit var progressBar: ProgressBar
    private lateinit var toolbar: ActionBar
    private lateinit var toolbarMenu: Menu

    private val allegianceFilter: HvzData<String?> = HvzData(null)

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
        leaderboardViewModel = LeaderboardViewModel()
        memberAdapter = MemberAdapter(
            listOf(),
            requireContext(),
            { playerId -> PlayerUtils.viewPlayerProfile(playerId, gameId, findNavController()) }
        )
        setupToolbar()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_leaderboard, container, false)
        progressBar = view.findViewById(R.id.progress_bar)
        memberRecyclerView = view.findViewById(R.id.player_list)
        val layoutManager = LinearLayoutManager(context)
        memberRecyclerView.layoutManager = layoutManager
        memberRecyclerView.adapter = memberAdapter
        setupObservers()
        return view
    }

    override fun onCreateOptionsMenu(menu: Menu, inflater: MenuInflater) {
        inflater.inflate(R.menu.menu_filter_list, menu)
        toolbarMenu = menu
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == R.id.filter_option) {
            val anchor = requireActivity().findViewById<ActionMenuItemView>(R.id.filter_option)
            showPopupMenu(anchor!!)
        }
        return super.onOptionsItemSelected(item)
    }

    private fun setupToolbar() {
        toolbar.title = getString(R.string.navigation_drawer_leaderboard)
        setHasOptionsMenu(true)
    }

    private fun setupObservers() {
        if (gameId.isNullOrEmpty()) {
            return
        }
        leaderboardViewModel.getLeaderboard(gameId!!, allegianceFilter, viewLifecycleOwner).observe(
            this, androidx.lifecycle.Observer { playerList ->
                if (playerList.isNotEmpty()) {
                    progressBar.visibility = View.GONE
                }
                onPlayerListUpdated(playerList)
            }
        )
        // We need to trigger the leaderboard's observer on the livedata so set it to something blank
        allegianceFilter.value = ""
    }

    private fun onPlayerListUpdated(serverPlayerList: List<Player?>) {
        memberAdapter.setData(serverPlayerList)
    }

    private fun showPopupMenu(anchor: View) {
        val popup = PopupMenu(requireContext(), anchor)
        popup.menuInflater.inflate(R.menu.menu_leaderboard_filter, popup.getMenu())
        popup.setOnMenuItemClickListener { item: MenuItem? ->
            if (item == null) {
                return@setOnMenuItemClickListener false
            }
            when (item.itemId) {
                R.id.human_option -> {
                    allegianceFilter.value = HUMAN
                }
                R.id.zombie_option -> {
                    allegianceFilter.value = ZOMBIE
                }
                else -> {
                    allegianceFilter.value = null
                }
            }
            return@setOnMenuItemClickListener true
        }
        popup.show()
    }
}