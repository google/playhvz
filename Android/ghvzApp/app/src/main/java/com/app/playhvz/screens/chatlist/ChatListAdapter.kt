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

package com.app.playhvz.screens.chatlist

import android.content.Context
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.ChatRoom

class ChatListAdapter(
    private var items: List<ChatRoom>,
    val context: Context,
    val navigator: IFragmentNavigator
) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    interface IFragmentNavigator {
        fun onChatRoomClicked(chatRoomId: String)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return ChatRoomViewHolder(
            LayoutInflater.from(context).inflate(
                R.layout.list_item_chat_list_chatroom,
                parent,
                false
            )
        )
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        (holder as ChatRoomViewHolder).onBind(items[position], navigator)
    }

    override fun getItemCount(): Int {
        return items.size
    }

    fun setData(data: Map<String, ChatRoom?>) {
        val cleansedList = mutableListOf<ChatRoom>()
        for ((_, value) in data) {
            if (value != null) {
                cleansedList.add(value)
            }
        }
        items = cleansedList
    }
}