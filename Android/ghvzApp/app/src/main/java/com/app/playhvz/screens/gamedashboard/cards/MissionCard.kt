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
import androidx.emoji.widget.EmojiTextView
import androidx.navigation.NavController
import com.app.playhvz.R
import com.app.playhvz.common.ui.MarkdownTextView
import com.app.playhvz.firebase.classmodels.Mission
import com.app.playhvz.firebase.viewmodels.MissionListViewModel
import com.app.playhvz.screens.gamedashboard.GameDashboardFragment
import com.app.playhvz.utils.TimeUtils
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView

class MissionCard(
    val fragment: GameDashboardFragment,
    private val navController: NavController,
    val gameId: String,
    val playerId: String
) {

    private lateinit var missionCard: MaterialCardView
    private lateinit var missionViewModel: MissionListViewModel
    private lateinit var cardTitle: EmojiTextView
    private lateinit var startTimeView: TextView
    private lateinit var endTimeView: TextView
    private lateinit var detailsView: MarkdownTextView
    private lateinit var cardHeader: LinearLayout
    private lateinit var cardHeaderIcon: MaterialButton
    private lateinit var cardContent: ConstraintLayout

    private var mission: Mission? = null

    fun onCreateView(view: View) {
        missionCard = view.findViewById(R.id.mission_card)
        cardTitle = missionCard.findViewById(R.id.title)
        startTimeView = missionCard.findViewById(R.id.mission_start_time)
        endTimeView = missionCard.findViewById(R.id.mission_end_time)
        detailsView = missionCard.findViewById(R.id.mission_details)
        cardHeader = missionCard.findViewById(R.id.card_header)
        cardHeaderIcon = missionCard.findViewById(R.id.card_header_icon)
        cardContent = missionCard.findViewById(R.id.card_content)

        cardHeader.setOnClickListener {
            if (cardContent.visibility == View.VISIBLE) {
                // Collapse the card content
                cardContent.visibility = View.GONE
            } else {
                // Display the card content
                cardContent.visibility = View.VISIBLE
            }
        }
        setupObserver()
    }

    private fun setupObserver() {
        missionViewModel = MissionListViewModel()
        missionViewModel.getLatestMissionPlayerIsIn(fragment.viewLifecycleOwner, gameId, playerId)
            .observe(fragment.viewLifecycleOwner, androidx.lifecycle.Observer { missionMap ->
                if (missionMap.isEmpty()) {
                    missionCard.visibility = View.GONE
                } else {
                    missionCard.visibility = View.VISIBLE
                    showFirstMission(missionMap)
                }
            })
    }

    private fun showFirstMission(missionMap: Map<String, Mission?>) {
        val mission = missionMap.values.first()!!
        cardHeaderIcon.visibility = View.GONE
        cardTitle.text = mission.name
        startTimeView.text = TimeUtils.getFormattedTime(mission.startTime, true)
        endTimeView.text = TimeUtils.getFormattedTime(mission.endTime, true)
        detailsView.text = mission.details
    }
}