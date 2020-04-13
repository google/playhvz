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
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.emoji.widget.EmojiTextView
import com.app.playhvz.R
import com.app.playhvz.common.globals.CrossClientConstants.Companion.HUMAN
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.screens.gamedashboard.GameDashboardFragment
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView

class LifeCodeCard(
    val fragment: GameDashboardFragment,
    val gameId: String,
    val playerId: String
) : DashboardCardInterface {

    private lateinit var lifeCodeCard: MaterialCardView
    private lateinit var cardHeader: LinearLayout
    private lateinit var cardHeaderIcon: MaterialButton
    private lateinit var cardContent: ConstraintLayout
    private lateinit var lifeCodeText: EmojiTextView

    private var player: Player? = null

    override fun onCreateView(view: View) {
        lifeCodeCard = view.findViewById(R.id.life_code_card)
        cardHeader = lifeCodeCard.findViewById(R.id.card_header)
        cardHeaderIcon = lifeCodeCard.findViewById(R.id.card_header_icon)
        cardContent = lifeCodeCard.findViewById(R.id.card_content)
        lifeCodeText = lifeCodeCard.findViewById(R.id.player_life_code)

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
        if (updatedPlayer.lives.isEmpty()) {
            hide()
            return
        }
        player = updatedPlayer

        if (updatedPlayer.allegiance.isEmpty() || updatedPlayer.allegiance != HUMAN) {
            hide()
            return
        } else {
            show()
        }

        // Get the latest life code value.
        val sortedList = updatedPlayer.lifeCodes.values.toMutableList()
        sortedList.sortBy { lifeCode -> lifeCode.created }
        sortedList.reverse()
        lifeCodeText.text = sortedList.first().lifeCode
    }

    private fun hide() {
        lifeCodeCard.visibility = View.GONE
    }

    private fun show() {
        lifeCodeCard.visibility = View.VISIBLE
    }
}