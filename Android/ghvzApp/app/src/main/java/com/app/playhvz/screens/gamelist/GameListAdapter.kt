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

package com.app.playhvz.screens.gamelist

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.Game

class GameListAdapter(
    private var items: List<Any>,
    val context: Context,
    val navigator: IFragmentNavigator
) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    interface IFragmentNavigator {
        fun onGameClicked(gameId: String)
    }

    enum class ViewType {
        HEADER,
        GAME,
        JOIN_BUTTON
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        if (viewType == ViewType.GAME.ordinal) {
            return GameViewHolder(
                LayoutInflater.from(context).inflate(
                    R.layout.list_item_game_list_game,
                    parent,
                    false
                )
            )
        } else if (viewType == ViewType.JOIN_BUTTON.ordinal) {
            return JoinButtonViewHolder(
                LayoutInflater.from(context).inflate(
                    R.layout.list_item_game_list_join_button,
                    parent,
                    false
                )
            )
        }
        return HeaderViewHolder(
            LayoutInflater.from(context).inflate(
                R.layout.list_item_game_list_header,
                parent,
                false
            )
        )
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (holder) {
            is GameViewHolder -> {
                holder.onBind(items[position] as Game, navigator)
            }
            is JoinButtonViewHolder -> {
                holder.onBind(R.string.game_list_join_game_button, items[position] as View.OnClickListener)
            }
            else -> (holder as HeaderViewHolder).onBind(items[position] as String)
        }
    }

    override fun getItemCount(): Int {
        return items.size
    }

    override fun getItemViewType(position: Int): Int {
        if (items[position] is Game) {
            return ViewType.GAME.ordinal
        } else if (items[position] is View.OnClickListener) {
            return ViewType.JOIN_BUTTON.ordinal
        }
        return ViewType.HEADER.ordinal
    }

    fun setData(data: List<Any>) {
        items = data
    }
}