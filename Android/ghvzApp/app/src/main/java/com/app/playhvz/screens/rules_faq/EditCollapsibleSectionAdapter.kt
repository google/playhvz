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

import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.ImageButton
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.MarkdownInfoDialog
import com.app.playhvz.firebase.classmodels.Game


class EditCollapsibleSectionAdapter(
    private var items: List<Game.CollapsibleSection>,
    val fragment: Fragment,
    val onSectionAdded: () -> Unit?
) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    companion object {
        private val TAG = EditCollapsibleSectionAdapter::class.qualifiedName
    }


    private val TYPE_COLLAPSIBLE_SECTION_ITEM = 1
    private val TYPE_ADD = 2

    private val ADD_SECTION_COUNT = 1

    override fun getItemViewType(position: Int): Int {
        return if (position == items.size) {
            TYPE_ADD
        } else {
            TYPE_COLLAPSIBLE_SECTION_ITEM
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        if (viewType == TYPE_ADD) {
            return AddCollapsibleSectionViewHolder(
                LayoutInflater.from(fragment.context).inflate(
                    R.layout.list_item_add_collapsible_section,
                    parent,
                    false
                ),
                onSectionAdded
            )
        }

        val editableSectionLayout = LayoutInflater.from(fragment.context).inflate(
            R.layout.list_item_collapsible_section_edit,
            parent,
            false
        )
        return EditCollapsibleSectionViewHolder(
            LayoutInflater.from(fragment.context).inflate(
                R.layout.list_item_collapsible_section_edit,
                parent,
                false
            ),
            TitleTextWatcher(),
            ContentTextWatcher()
        )
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        if (getItemViewType(position) == TYPE_ADD) {
            (holder as AddCollapsibleSectionViewHolder).onBind()
        } else {
            (holder as EditCollapsibleSectionViewHolder).onBind(position, items[position])
        }
    }

    override fun getItemCount(): Int {
        return items.size + ADD_SECTION_COUNT
    }

    fun setData(sections: List<Game.CollapsibleSection>) {
        items = sections.sortedBy { section -> section.order }
    }

    fun getLatestData(): List<Game.CollapsibleSection> {
        return items
    }

    // The EditText TextWatcher must know the current position so when the view is reused in onBind
    // we'll be updating the right Collapsible Section.
    inner class TitleTextWatcher : TextWatcher {
        private var position = 0
        fun setPosition(position: Int) {
            this.position = position
        }

        override fun beforeTextChanged(
            charSequence: CharSequence,
            i: Int,
            i2: Int,
            i3: Int
        ) {
            // no op
        }

        override fun onTextChanged(
            charSequence: CharSequence,
            i: Int,
            i2: Int,
            i3: Int
        ) {
            items[position].sectionTitle = charSequence.toString()
        }

        override fun afterTextChanged(editable: Editable) {
            // no op
        }
    }

    inner class ContentTextWatcher : TextWatcher {
        private var position = 0
        fun setPosition(position: Int) {
            this.position = position
        }

        override fun beforeTextChanged(
            charSequence: CharSequence,
            i: Int,
            i2: Int,
            i3: Int
        ) {
            // no op
        }

        override fun onTextChanged(
            charSequence: CharSequence,
            i: Int,
            i2: Int,
            i3: Int
        ) {
            items[position].sectionContent = charSequence.toString()
        }

        override fun afterTextChanged(editable: Editable) {
            // no op
        }
    }
}