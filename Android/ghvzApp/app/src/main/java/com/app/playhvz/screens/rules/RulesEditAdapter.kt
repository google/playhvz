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

import android.content.Context
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.Game


class RulesEditAdapter(
    private var items: List<Game.Rule>,
    val context: Context,
    val onRuleAdded: () -> Unit?
) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private val TYPE_RULE = 1
    private val TYPE_ADD = 2

    private val ADD_SECTION_COUNT = 1

    override fun getItemViewType(position: Int): Int {
        return if (position == items.size) {
            TYPE_ADD
        } else {
            TYPE_RULE
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        if (viewType == TYPE_ADD) {
            return AddCollapsibleSectionViewHolder(
                LayoutInflater.from(context).inflate(
                    R.layout.list_item_add_collapsible_section,
                    parent,
                    false
                ),
                onRuleAdded
            )
        }
        return CollapsibleSectionEditViewHolder(
            LayoutInflater.from(context).inflate(
                R.layout.list_item_collapsible_section_edit,
                parent,
                false
            )
        )
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        if (getItemViewType(position) == TYPE_ADD) {
            (holder as AddCollapsibleSectionViewHolder).onBind()
        } else {
            (holder as CollapsibleSectionEditViewHolder).onBind(items[position])
        }
    }

    override fun getItemCount(): Int {
        return items.size + ADD_SECTION_COUNT
    }

    fun setData(rules: List<Game.Rule>) {
        items = rules.sortedBy { rule -> rule.order }
    }
}