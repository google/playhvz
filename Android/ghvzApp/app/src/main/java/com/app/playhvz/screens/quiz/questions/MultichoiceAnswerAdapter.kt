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

package com.app.playhvz.screens.quiz.questions

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.QuizQuestion
import com.app.playhvz.screens.quiz.OrderingController.OrderModification
import com.app.playhvz.screens.rules_faq.AddCollapsibleSectionViewHolder


class MultichoiceAnswerAdapter(
    private var items: List<QuizQuestion.Answer>,
    val fragment: Fragment,
    val onAdd: () -> Unit?,
    val onEdit: (position: Int) -> Unit?,
    val onDelete: (position: Int) -> Unit?,
    val onChangeOrder: (position: Int, mod: OrderModification) -> Unit?
) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    companion object {
        private val TAG = MultichoiceAnswerAdapter::class.qualifiedName
    }

    private val TYPE_ITEM = 1
    private val TYPE_ADD = 2

    private val ADD_SECTION_COUNT = 1

    override fun getItemViewType(position: Int): Int {
        return if (position == items.size) {
            TYPE_ADD
        } else {
            TYPE_ITEM
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
                onAdd
            )
        }

        return MultichoiceAnswerViewHolder(
            fragment.requireContext(),
            LayoutInflater.from(fragment.context).inflate(
                R.layout.list_item_quiz_answer,
                parent,
                false
            ),
            onEdit,
            onDelete,
            onChangeOrder
        )
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        if (getItemViewType(position) == TYPE_ADD) {
            (holder as AddCollapsibleSectionViewHolder).onBind()
        } else {
            val isLastAnswer = position == (itemCount - 2)
            (holder as MultichoiceAnswerViewHolder).onBind(position, items[position], isLastAnswer)
        }
    }

    override fun getItemCount(): Int {
        return items.size + ADD_SECTION_COUNT
    }

    fun setData(sections: List<QuizQuestion.Answer>) {
        items = sections
    }
}