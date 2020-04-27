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

package com.app.playhvz.screens.chatroom

import android.view.View
import android.widget.TextView
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LiveData
import androidx.lifecycle.observe
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.UserAvatarPresenter
import com.app.playhvz.firebase.classmodels.Message
import com.app.playhvz.firebase.classmodels.Player
import com.google.firebase.Timestamp
import java.text.SimpleDateFormat


class MessageViewHolder(val view: View) : RecyclerView.ViewHolder(view) {

    private val COALESCE_THRESHOLD = 150 // seconds
    private val avatarView = view.findViewById<ConstraintLayout>(R.id.player_avatar)!!
    private val messageView = view.findViewById<TextView>(R.id.message)!!
    private val nameView = view.findViewById<TextView>(R.id.player_name)!!
    private val timestampView = view.findViewById<TextView>(R.id.timestamp)!!

    fun onBind(
        message: Message,
        player: LiveData<Player>?,
        previousMessage: Message?,
        lifecycleOwner: LifecycleOwner
    ) {
        messageView.text = message.message
        if (!shouldCoalesce(message, previousMessage)) {
            itemView.setPadding(
                itemView.paddingLeft,
                itemView.context.resources.getDimensionPixelSize(R.dimen.chat_message_padding_top),
                itemView.paddingRight,
                itemView.paddingBottom
            )
            avatarView.visibility = View.VISIBLE
            nameView.visibility = View.VISIBLE
            timestampView.visibility = View.VISIBLE
            if (message.timestamp != null) {
                timestampView.text = getDate(message.timestamp!!)
            }
            player?.observe(lifecycleOwner) { updatedPlayer ->
                updateDisplayedPlayerData(updatedPlayer)
            }
        } else {
            itemView.setPadding(
                itemView.paddingLeft,
                0,
                itemView.paddingRight,
                itemView.paddingBottom
            )
            avatarView.visibility = View.GONE
            nameView.visibility = View.GONE
            timestampView.visibility = View.GONE
        }
    }

    private fun updateDisplayedPlayerData(player: Player) {
        val userAvatarPresenter = UserAvatarPresenter(avatarView, R.dimen.avatar_small)
        userAvatarPresenter.renderAvatar(player)
        nameView.text = player.name
    }

    private fun getDate(timestamp: Timestamp): String {
        val sfd = SimpleDateFormat("MMM d  h:mm a")
        return sfd.format(timestamp.toDate())
    }

    private fun shouldCoalesce(message: Message, previousMessage: Message?): Boolean {
        if (previousMessage == null || message.senderId != previousMessage.senderId) {
            return false
        }
        if (message.timestamp != null && previousMessage.timestamp != null
            && (message.timestamp!!.seconds - previousMessage.timestamp!!.seconds) < COALESCE_THRESHOLD
        ) {
            return true
        }
        return false
    }
}