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

package com.app.playhvz.common.playersearch

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.Player
import com.google.android.material.button.MaterialButton

class PlayerAdapter(
    private var items: List<Player>,
    val context: Context,
    val playerSelectedClickHandler: PlayerSearchClickHandler,
    val maxSelectable: Int? = null
) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>(), PlayerViewHolder.PlayerClickListener {

    interface PlayerSearchClickHandler {
        fun onPlayerClicked(anyPlayerSelected: Boolean)
    }

    private val selectedPlayers = mutableSetOf<String>()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val playerViewHolder = PlayerViewHolder(
            LayoutInflater.from(context).inflate(
                R.layout.list_item_player,
                parent,
                false
            )
        )
        val checkIcon = playerViewHolder.view.findViewById<MaterialButton>(R.id.additional_icon)
        checkIcon.setIconResource(R.drawable.ic_circle_check)
        checkIcon.isClickable = false
        checkIcon.background = null
        return playerViewHolder
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        (holder as PlayerViewHolder).onBind(items[position], this)
    }

    override fun getItemCount(): Int {
        return items.size
    }

    override fun onPlayerClicked(checkIcon: MaterialButton, player: Player) {
        val playerId = player.id!!
        if (selectedPlayers.contains(playerId)) {
            // Deselect the player
            selectedPlayers.remove(playerId)
            checkIcon.visibility = View.GONE
            checkIcon.isEnabled = false
        } else {
            selectedPlayers.add(playerId)
            checkIcon.visibility = View.VISIBLE
            checkIcon.isEnabled = true
        }
        val allowSubmit = if (maxSelectable != null) {
            selectedPlayers.isNotEmpty() && selectedPlayers.size <= maxSelectable
        } else {
            selectedPlayers.isNotEmpty()
        }
        playerSelectedClickHandler.onPlayerClicked(allowSubmit)
    }

    fun setData(data: List<Player>) {
        items = data
    }

    fun getSelectedPlayers(): Set<String> {
        return selectedPlayers.toSet()
    }
}