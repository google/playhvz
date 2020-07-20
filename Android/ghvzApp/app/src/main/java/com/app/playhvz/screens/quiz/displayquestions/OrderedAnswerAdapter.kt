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

package com.app.playhvz.screens.quiz.displayquestions

import android.content.Context
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.QuizQuestion
import com.app.playhvz.screens.quiz.OrderingController


class OrderedAnswerAdapter(
    private var context: Context,
    private var items: Array<QuizQuestion.Answer?>
) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    companion object {
        private val TAG = OrderedAnswerAdapter::class.qualifiedName
    }

    private val NULL_TYPE = 1
    private val NON_NULL_TYPE = 2

    private var optionalAdapter: OptionalAnswerAdapter? = null

    private val reorderAnswer =
        { adapterPosition: Int, modification: OrderingController.OrderModification ->
            val currentAnswer = items[adapterPosition]
            if (modification == OrderingController.OrderModification.MOVE_UP) {
                items[adapterPosition] = items[adapterPosition - 1]
                items[adapterPosition - 1] = currentAnswer
            } else if (modification == OrderingController.OrderModification.MOVE_DOWN) {
                items[adapterPosition] = items[adapterPosition + 1]
                items[adapterPosition + 1] = currentAnswer
            }
            notifyDataSetChanged()
        }

    private val deleteAnswer = Unit@{ adapterPosition: Int ->
        if (items[adapterPosition] == null) {
            return@Unit
        }
        optionalAdapter?.addAnswerBack(items[adapterPosition]!!)
        items[adapterPosition] = null
        notifyDataSetChanged()
    }

    override fun getItemViewType(position: Int): Int {
        return if (items[position] == null) {
            NULL_TYPE
        } else {
            NON_NULL_TYPE
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return if (viewType == NULL_TYPE) {
            return OrderedAnswerUnselectedViewHolder(
                LayoutInflater.from(context).inflate(
                    R.layout.list_item_quiz_answer_ordered_blank,
                    parent,
                    false
                )
            )
        } else {
            OrderedAnswerViewHolder(
                LayoutInflater.from(context).inflate(
                    R.layout.list_item_quiz_answer_ordered,
                    parent,
                    false
                ),
                reorderAnswer,
                deleteAnswer
            )
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        if (getItemViewType(position) == NULL_TYPE) {
            (holder as OrderedAnswerUnselectedViewHolder).onBind()
            return
        }
        (holder as OrderedAnswerViewHolder).onBind(
            position,
            items[position]!!,
            position == itemCount - 1
        )
    }

    override fun getItemCount(): Int {
        return items.size
    }

    fun setOptionalAnswerAdapter(optionalAdapter: OptionalAnswerAdapter) {
        this.optionalAdapter = optionalAdapter
    }

    fun getOrderedAnswers(): Array<QuizQuestion.Answer?> {
        return items
    }

    fun addAnswer(answer: QuizQuestion.Answer) {
        for (i in items.indices) {
            if (items[i] == null) {
                items[i] = answer
                return
            }
        }
        val last = items.size - 1
        if (items[last] != null) {
            optionalAdapter?.addAnswerBack(items[last]!!)
        }
        items[last] = answer
        notifyDataSetChanged()
    }
}