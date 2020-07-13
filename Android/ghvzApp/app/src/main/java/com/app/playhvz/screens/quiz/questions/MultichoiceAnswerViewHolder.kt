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

import android.view.View
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.ui.MarkdownTextView
import com.app.playhvz.firebase.classmodels.Question


class MultichoiceAnswerViewHolder(
    val view: View,
    val onEdit: (position: Int) -> Unit?,
    val onDelete: (position: Int) -> Unit?
) : RecyclerView.ViewHolder(view) {

    private val answerButton = view.findViewById<MarkdownTextView>(R.id.answer_button)!!
    private val deleteButton = view.findViewById<ImageButton>(R.id.delete_button)!!
    private val orderView = view.findViewById<TextView>(R.id.answer_order)!!
    private val correctnessView = view.findViewById<MarkdownTextView>(R.id.answer_correctness)!!

    fun onBind(position: Int, answer: Question.Answer) {
        val res = orderView.resources
        deleteButton.setOnClickListener {
            onDelete.invoke(position)
        }
        answerButton.text = if (answer.text.isEmpty()) {
            res.getString(R.string.quiz_answer_empty_text)
        } else {
            answer.text
        }
        answerButton.setOnClickListener {
            onEdit.invoke(position)
        }

        orderView.text = res.getString(R.string.quiz_answer_order_text, answer.order)
        val correctness =
            if (answer.isCorrect) R.string.quiz_answer_correct_text else R.string.quiz_answer_incorrect_text
        correctnessView.text = res.getString(correctness)
    }
}