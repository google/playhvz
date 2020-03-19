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
import android.widget.EditText
import androidx.core.widget.doOnTextChanged
import com.app.playhvz.R
import com.app.playhvz.common.globals.CrossClientConstants
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.screens.gamedashboard.GameDashboardFragment
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView

class InfectCard(
    val fragment: GameDashboardFragment,
    val gameId: String,
    val playerId: String
) : DashboardCardInterface {

    lateinit var cardView: MaterialCardView
    lateinit var inputView: EditText
    lateinit var sendButton: MaterialButton

    private var player: Player? = null

    override fun onCreateView(view: View) {
        cardView = view.findViewById(R.id.infect_card)
        inputView = cardView.findViewById(R.id.lifecode_input)
        sendButton = cardView.findViewById(R.id.send_button)

        inputView.doOnTextChanged { text, _, _, _ ->
            when {
                text.isNullOrEmpty() || text.isBlank() -> {
                    sendButton.isEnabled = false
                }
                else -> {
                    sendButton.isEnabled = true
                }
            }
        }
        sendButton.setOnClickListener {

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
        cardView.visibility = if (player?.allegiance !in CrossClientConstants.DEAD_ALLEGIANCES) {
            View.GONE
        } else {
            View.VISIBLE
        }
    }
}