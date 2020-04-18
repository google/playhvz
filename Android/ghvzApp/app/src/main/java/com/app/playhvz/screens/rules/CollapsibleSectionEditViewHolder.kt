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

package com.app.playhvz.screens.rules

import android.view.View
import androidx.emoji.widget.EmojiTextView
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.ui.MarkdownView
import com.app.playhvz.firebase.classmodels.Game

class CollapsibleSectionEditViewHolder(val view: View) : RecyclerView.ViewHolder(view) {

    private val sectionTitle = view.findViewById<EmojiTextView>(R.id.section_title)!!
    private val sectionContent = view.findViewById<MarkdownView>(R.id.section_content)!!

    fun onBind(rule: Game.Rule) {
        sectionTitle.text = rule.sectionTitle
        sectionContent.text = rule.sectionContent
        itemView.setOnClickListener {
            if (sectionContent.visibility == View.VISIBLE) {
                sectionContent.visibility = View.GONE
            } else {
                sectionContent.visibility = View.VISIBLE
            }
        }
    }
}