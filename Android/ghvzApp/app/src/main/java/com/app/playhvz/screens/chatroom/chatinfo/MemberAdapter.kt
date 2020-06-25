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

package com.app.playhvz.screens.chatroom.chatinfo

import android.content.Context
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.lifecycle.LifecycleOwner
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.Player

class MemberAdapter(
    private var items: List<Player>,
    val context: Context,
    val onIconClicked: (player: Player) -> Unit,
    private val viewProfile: ((playerId: String) -> Unit)?
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private var canRemovePlayers: Boolean = false
    private var ownerPlayerIds: List<String> = listOf()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return MemberViewHolder(
            LayoutInflater.from(context).inflate(
                R.layout.list_item_player,
                parent,
                false
            ),
            viewProfile
        )
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val player = items[position]
        val showIcon = canRemovePlayers && !ownerPlayerIds.contains(player.id)
        (holder as MemberViewHolder).onBind(items[position], onIconClicked, showIcon)
    }

    override fun getItemCount(): Int {
        return items.size
    }

    fun setData(data: Map<String, Player?>) {
        val cleansedList = mutableListOf<Player>()
        for ((_, value) in data) {
            if (value != null) {
                cleansedList.add(value)
            }
        }
        items = cleansedList
    }

    fun setCanRemovePlayer(canKick: Boolean) {
        canRemovePlayers = canKick
    }

    fun setGroupOwnerPlayerId(owners: List<String>) {
        ownerPlayerIds = owners
    }
}