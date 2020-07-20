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
import androidx.navigation.fragment.NavHostFragment.findNavController
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.app.debug.DebugFlags
import com.app.playhvz.common.globals.CrossClientConstants
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.operations.PlayerDatabaseOperations
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.screens.gamedashboard.GameDashboardFragment
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.runBlocking

class DeclareAllegianceCard(
    val fragment: GameDashboardFragment,
    val gameId: String,
    val playerId: String
) : DashboardCardInterface {

    lateinit var declareAllegianceCard: MaterialCardView
    lateinit var declareButton: MaterialButton
    lateinit var cardHeader: LinearLayout
    lateinit var cardHeaderIcon: MaterialButton
    lateinit var cardContent: ConstraintLayout

    private var player: Player? = null

    override fun onCreateView(view: View) {
        declareAllegianceCard = view.findViewById(R.id.declare_allegiance_card)
        declareButton = declareAllegianceCard.findViewById(R.id.declare_button)
        cardHeader = declareAllegianceCard.findViewById(R.id.card_header)
        cardHeaderIcon = declareAllegianceCard.findViewById(R.id.card_header_icon)
        cardContent = declareAllegianceCard.findViewById(R.id.card_content)

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
        if (player != null) {
            val previousAllegiance = player?.allegiance
            if (previousAllegiance.equals(updatedPlayer.allegiance)) {
                // Allegiance wasn't updated so we don't care what changed.
                return
            }
        }
        player = updatedPlayer
        updateAllegiance()
    }

    private fun updateAllegiance() {
        if (player?.allegiance.isNullOrEmpty()) {
            // We don't have accurate player data, don't change the current state.
            return
        }
        if (player?.allegiance != CrossClientConstants.UNDECLARED) {
            // Allegiance is declared already.
            if (!DebugFlags.isDevEnvironment) {
                declareAllegianceCard.visibility = View.GONE
            } else {
                cardHeaderIcon.visibility = View.VISIBLE
                declareButton.setText(R.string.declare_allegiance_card_button_undeclare)
                declareButton.setOnClickListener {
                    runBlocking {
                        EspressoIdlingResource.increment()
                        PlayerDatabaseOperations.setPlayerAllegiance(
                            gameId,
                            playerId,
                            CrossClientConstants.UNDECLARED,
                            {},
                            {})
                        EspressoIdlingResource.decrement()
                    }
                }
            }
        } else {
            // Allegiance isn't declared.
            if (DebugFlags.isDevEnvironment) {
                cardHeaderIcon.visibility = View.GONE
            }
            declareButton.setText(R.string.declare_allegiance_card_button)
            declareButton.setOnClickListener {
                NavigationUtil.navigateToTakeQuizFragment(findNavController(fragment))
            }
            declareAllegianceCard.visibility = View.VISIBLE
        }
    }
}