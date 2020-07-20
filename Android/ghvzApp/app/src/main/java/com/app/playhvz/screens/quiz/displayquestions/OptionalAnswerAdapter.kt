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


class OptionalAnswerAdapter(
    private var context: Context,
    private var items: MutableList<QuizQuestion.Answer>
) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>() {
    companion object {
        private val TAG = OptionalAnswerAdapter::class.qualifiedName
    }

    private var orderedAdapter: OrderedAnswerAdapter? = null

    private val selectAnswer = { adapterPosition: Int ->
        orderedAdapter?.addAnswer(items[adapterPosition])
        items.removeAt(adapterPosition)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return OptionalAnswerViewHolder(
            LayoutInflater.from(context).inflate(
                R.layout.list_item_quiz_answer_orderable,
                parent,
                false
            ),
            selectAnswer
        )
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        (holder as OptionalAnswerViewHolder).onBind(position, items[position])
    }

    override fun getItemCount(): Int {
        return items.size
    }

    fun setOrderedAdapter(orderedAdapter: OrderedAnswerAdapter) {
        this.orderedAdapter = orderedAdapter
    }

    fun addAnswerBack(answer: QuizQuestion.Answer) {
        items.add(answer)
        notifyDataSetChanged()
    }
}