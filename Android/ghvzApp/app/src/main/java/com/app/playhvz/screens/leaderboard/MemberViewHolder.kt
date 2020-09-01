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

import android.view.View
import android.widget.TextView
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.UserAvatarPresenter
import com.app.playhvz.firebase.classmodels.Player


class MemberViewHolder(val view: View, private val viewProfile: ((playerId: String) -> Unit)?) :
    RecyclerView.ViewHolder(view) {

    private val avatarView = view.findViewById<ConstraintLayout>(R.id.player_avatar_container)!!
    private val nameView = view.findViewById<TextView>(R.id.player_name)!!
    private val allegianceView = view.findViewById<TextView>(R.id.player_allegiance)!!
    private val pointView = view.findViewById<TextView>(R.id.player_points)!!
    private var player: Player? = null

    fun onBind(player: Player?) {
        this.player = player
        updateDisplayedPlayerData(player!!)
        if (viewProfile != null) {
            view.setOnClickListener { viewProfile.invoke(player.id!!) }
        }
    }

    private fun updateDisplayedPlayerData(player: Player) {
        val userAvatarPresenter = UserAvatarPresenter(avatarView, R.dimen.avatar_large)
        userAvatarPresenter.renderAvatar(player)
        nameView.text = player.name
        allegianceView.text = player.allegiance
        pointView.text = player.points.toString()
    }
}