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
import androidx.lifecycle.LifecycleOwner
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.UserAvatarPresenter
import com.app.playhvz.firebase.classmodels.Player


class MemberViewHolder(val view: View) : RecyclerView.ViewHolder(view) {

    private val avatarView = view.findViewById<ConstraintLayout>(R.id.player_avatar)!!
    private val overflowView = view.findViewById<TextView>(R.id.player_options)!!
    private val nameView = view.findViewById<TextView>(R.id.player_name)!!

    fun onBind(player: Player?, lifecycleOwner: LifecycleOwner) {
        updateDisplayedPlayerData(player!!)
    }

    /* fun onBind(player: LiveData<Player>?, lifecycleOwner: LifecycleOwner) {
        player?.observe(lifecycleOwner) { updatedPlayer ->
            updateDisplayedPlayerData(updatedPlayer)
        }
    } */
    private fun updateDisplayedPlayerData(player: Player) {
        val userAvatarPresenter = UserAvatarPresenter(avatarView, R.dimen.avatar_small)
        userAvatarPresenter.renderAvatar(player)
        nameView.text = player.name
    }
}