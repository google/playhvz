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

package com.app.playhvz.screens.rules_faq

import android.view.View
import androidx.emoji.widget.EmojiEditText
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.Game


class EditCollapsibleSectionViewHolder(
    val view: View,
    val titleTextWatcher: EditCollapsibleSectionAdapter.TitleTextWatcher,
    val contentTextWatcher: EditCollapsibleSectionAdapter.ContentTextWatcher
) : RecyclerView.ViewHolder(view) {

    private val sectionTitle = view.findViewById<EmojiEditText>(R.id.section_title)!!
    private val sectionContent = view.findViewById<EmojiEditText>(R.id.section_content)!!

    fun onBind(position: Int, section: Game.CollapsibleSection) {
        titleTextWatcher.setPosition(position)
        contentTextWatcher.setPosition(position)
        sectionTitle.setText(section.sectionTitle)
        sectionTitle.addTextChangedListener(titleTextWatcher)
        sectionContent.setText(section.sectionContent)
        sectionContent.addTextChangedListener(contentTextWatcher)
    }
}