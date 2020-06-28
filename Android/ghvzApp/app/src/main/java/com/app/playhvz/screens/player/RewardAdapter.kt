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

package com.app.playhvz.screens.player

import android.content.Context
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.Reward

class RewardAdapter(
    val context: Context
) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private var items: List<Reward> = listOf()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return RewardViewHolder(
            context,
            LayoutInflater.from(context).inflate(
                R.layout.list_item_player_reward,
                parent,
                false
            )
        )
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        (holder as RewardViewHolder).onBind(items[position])
    }

    override fun getItemCount(): Int {
        return items.size
    }

    fun setData(data: Map<String, Pair<Reward?, Int>>) {
        val cleansedData: MutableList<Reward> = mutableListOf()
        for ((_, pair) in data) {
            if (pair.first == null) {
                continue
            }
            for (i in 0 until pair.second) {
                cleansedData.add(pair.first!!)
            }
        }
        items = cleansedData
        notifyDataSetChanged()
    }
}