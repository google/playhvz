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

package com.app.playhvz.screens.gamedashboard.cards

import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.viewmodels.LeaderboardViewModel
import com.app.playhvz.screens.gamedashboard.GameDashboardFragment
import com.app.playhvz.screens.leaderboard.MemberAdapter
import com.app.playhvz.utils.PlayerUtils
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import java.util.*

class LeaderboardCard(
    val fragment: GameDashboardFragment,
    val gameId: String,
    val playerId: String
) : DashboardCardInterface {

    private lateinit var leaderboardCard: MaterialCardView
    private lateinit var leaderboardRecyclerView: RecyclerView
    private lateinit var leaderboardAdapter: MemberAdapter
    private lateinit var leaderboardViewModel: LeaderboardViewModel
    private lateinit var cardHeader: LinearLayout
    private lateinit var cardTitle: TextView
    private lateinit var cardHeaderIcon: MaterialButton
    private lateinit var cardContent: ConstraintLayout

    private var player: Player? = null

    override fun onCreateView(view: View) {
        leaderboardViewModel = LeaderboardViewModel()
        leaderboardCard = view.findViewById(R.id.leaderboard_card)
        leaderboardRecyclerView = leaderboardCard.findViewById(R.id.player_list)
        cardHeader = leaderboardCard.findViewById(R.id.card_header)
        cardHeaderIcon = leaderboardCard.findViewById(R.id.card_header_icon)
        cardContent = leaderboardCard.findViewById(R.id.card_content)
        cardTitle = cardHeader.findViewById(R.id.title)

        leaderboardAdapter = MemberAdapter(
            listOf(),
            fragment.requireContext(),
            { playerId: String ->
                PlayerUtils.viewPlayerProfile(
                    playerId,
                    gameId,
                    fragment.findNavController()
                )
            })

        val layoutManager = LinearLayoutManager(fragment.requireContext())
        leaderboardRecyclerView.layoutManager = layoutManager
        leaderboardRecyclerView.adapter = leaderboardAdapter

        cardHeader.setOnClickListener {
            if (cardContent.visibility == View.VISIBLE) {
                // Collapse the card content
                cardContent.visibility = View.GONE
            } else {
                // Display the card content
                cardContent.visibility = View.VISIBLE
            }
        }
    }

    override fun onPlayerUpdated(updatedPlayer: Player) {
        player = updatedPlayer
        var allegiance = updatedPlayer.allegiance
        if (allegiance.isNotEmpty()) {
            allegiance =
                allegiance.substring(0, 1)
                    .toUpperCase(Locale.getDefault()) + allegiance.substring(1)
            cardTitle.setText(
                fragment.resources.getString(
                    R.string.leaderboard_card_title,
                    allegiance
                )
            )
        }

        val onPlayerListUpdated = { playerList: List<Player?> ->
            onPlayerListUpdated(playerList)
        }

        leaderboardViewModel.getLeaderboard(
            gameId,
            updatedPlayer.allegiance,
            fragment.viewLifecycleOwner,
            onPlayerListUpdated,
            /* maxListSize= */ 3
        )
    }

    private fun onPlayerListUpdated(serverPlayerList: List<Player?>) {
        leaderboardAdapter.setData(serverPlayerList)
    }
}