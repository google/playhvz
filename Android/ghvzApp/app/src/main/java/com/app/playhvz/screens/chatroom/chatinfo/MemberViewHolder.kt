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

import android.view.View
import android.widget.TextView
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.UserAvatarPresenter
import com.app.playhvz.firebase.classmodels.Player
import com.google.android.material.button.MaterialButton


class MemberViewHolder(val view: View) : RecyclerView.ViewHolder(view) {

    private val avatarView = view.findViewById<ConstraintLayout>(R.id.player_avatar_container)!!
    private val nameView = view.findViewById<TextView>(R.id.player_name)!!
    private val iconView = view.findViewById<MaterialButton>(R.id.additional_icon)!!

    fun onBind(player: Player?, onIconClicked: (player: Player) -> Unit, shouldShowIcon: Boolean) {
        updateDisplayedPlayerData(player!!)
        iconView.visibility = if (shouldShowIcon) {
            View.VISIBLE
        } else {
            View.INVISIBLE
        }
        if (shouldShowIcon) {
            iconView.setOnClickListener {
                onIconClicked.invoke(player)
            }
        }
    }

    private fun updateDisplayedPlayerData(player: Player) {
        val userAvatarPresenter = UserAvatarPresenter(avatarView, R.dimen.avatar_small)
        userAvatarPresenter.renderAvatar(player)
        nameView.text = player.name
    }
}