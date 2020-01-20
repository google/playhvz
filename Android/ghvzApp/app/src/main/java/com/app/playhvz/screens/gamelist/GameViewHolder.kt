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

import android.view.View
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.Game

class GameViewHolder(val view: View) : RecyclerView.ViewHolder(view) {

    var game: Game? = null
    val gameNameTextView = view.findViewById<TextView>(R.id.game_name)

    fun onBind(game: Game?, navigator: GameListAdapter.IFragmentNavigator) {
        this.game = game
        gameNameTextView.text = game?.name
        itemView.setOnClickListener {
            navigator.onGameClicked(game?.id!!)
        }
    }
}