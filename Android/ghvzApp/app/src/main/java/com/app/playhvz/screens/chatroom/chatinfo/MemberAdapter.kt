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
import androidx.lifecycle.LiveData
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.Player

class MemberAdapter(
    private var items: List<Player>,
    val context: Context,
    private val lifecycleOwner: LifecycleOwner
) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return MemberViewHolder(
            LayoutInflater.from(context).inflate(
                R.layout.list_item_player,
                parent,
                false
            )
        )
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        (holder as MemberViewHolder).onBind(items[position], lifecycleOwner)
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

    /*fun setData(data: List<LiveData<Player>>) {
        items = data
    } */
}