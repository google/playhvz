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
import android.widget.LinearLayout
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.widget.doOnTextChanged
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.globals.CrossClientConstants
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.operations.PlayerDatabaseOperations.Companion.infectPlayerByLifeCode
import com.app.playhvz.screens.gamedashboard.GameDashboardFragment
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.runBlocking

class InfectCard(
    val fragment: GameDashboardFragment,
    val gameId: String,
    val playerId: String
) : DashboardCardInterface {


    lateinit var infectCard: MaterialCardView
    lateinit var lifecodeInputView: EditText
    lateinit var lifecodeSubmitButton: MaterialButton
    lateinit var cardHeader: LinearLayout
    lateinit var cardHeaderIcon: MaterialButton
    lateinit var cardContent: ConstraintLayout

    private var player: Player? = null

    override fun onCreateView(view: View) {
        infectCard = view.findViewById(R.id.infect_card)
        lifecodeInputView = infectCard.findViewById(R.id.lifecode_input)
        lifecodeSubmitButton = infectCard.findViewById(R.id.send_button)
        cardHeader = infectCard.findViewById(R.id.card_header)
        cardHeaderIcon = infectCard.findViewById(R.id.card_header_icon)
        cardContent = infectCard.findViewById(R.id.card_content)


        cardHeader.setOnClickListener {
            if (cardContent.visibility == View.VISIBLE) {
                // Collapse the card content
                cardContent.visibility = View.GONE
            } else {
                // Display the card content
                cardContent.visibility = View.VISIBLE
            }
        }

        lifecodeInputView.doOnTextChanged { text, _, _, _ ->
            when {
                text.isNullOrEmpty() || text.isBlank() -> {
                    lifecodeSubmitButton.isEnabled = false
                }
                else -> {
                    lifecodeSubmitButton.isEnabled = true
                }
            }
        }

        val onSuccess = {
            lifecodeInputView.text.clear()
            EspressoIdlingResource.decrement()
            lifecodeSubmitButton.isEnabled = true
        }
        val onFail = {
            EspressoIdlingResource.decrement()
            lifecodeSubmitButton.isEnabled = true
        }
        lifecodeSubmitButton.setOnClickListener {
            lifecodeSubmitButton.isEnabled = false
            runBlocking {
                EspressoIdlingResource.increment()
                infectPlayerByLifeCode(
                    gameId, playerId, lifecodeInputView.text.toString(),
                    onSuccess,
                    onFail
                )
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

    fun hide() {
        infectCard.visibility = View.GONE
    }

    fun show() {
        infectCard.visibility = View.VISIBLE
    }

    private fun updateAllegiance() {
        if (player?.allegiance.isNullOrEmpty()) {
            // We don't have accurate player data, default to hiding infect human.
            hide()
            return
        }
        if (player?.allegiance !in CrossClientConstants.DEAD_ALLEGIANCES) {
            hide()
        } else {
            show()
        }
    }
}