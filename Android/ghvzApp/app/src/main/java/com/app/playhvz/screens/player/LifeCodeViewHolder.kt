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
import android.graphics.Paint.STRIKE_THRU_TEXT_FLAG
import android.view.View
import androidx.core.content.ContextCompat
import androidx.emoji.widget.EmojiTextView
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.Player

class LifeCodeViewHolder(val context: Context, val view: View) : RecyclerView.ViewHolder(view) {

    private var lifeCode: Player.LifeCodeMetadata? = null
    private val lifeCodeTextView = view.findViewById<EmojiTextView>(R.id.player_life_code)!!
    private val labelTextView = view.findViewById<EmojiTextView>(R.id.player_life_code_label)!!

    fun onBind(lifeCode: Player.LifeCodeMetadata) {
        this.lifeCode = lifeCode
        lifeCodeTextView.text = lifeCode.lifeCode

        if (adapterPosition == 0) {
            return
        }

        lifeCodeTextView.setTextColor(ContextCompat.getColor(context, R.color.grey500))
        labelTextView.setTextColor(ContextCompat.getColor(context, R.color.grey500))

        if (!lifeCode.alreadyUsed) {
            labelTextView.text = context.getString(R.string.player_profile_life_code_unused_label)
        } else {
            lifeCodeTextView.paintFlags = STRIKE_THRU_TEXT_FLAG
            labelTextView.text = context.getString(R.string.player_profile_life_code_used_label)
        }
    }
}