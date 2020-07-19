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

package com.app.playhvz.screens.quiz.editablequestions

import android.content.Context
import android.view.View
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.ui.MarkdownTextView
import com.app.playhvz.firebase.classmodels.QuizQuestion
import com.app.playhvz.screens.quiz.OrderingController
import com.app.playhvz.screens.quiz.OrderingController.OrderModification

class MultichoiceAnswerViewHolder(
    val context: Context,
    val view: View,
    val onEdit: (position: Int) -> Unit?,
    val onDelete: (position: Int) -> Unit?,
    onChangeOrder: (position: Int, modification: OrderModification) -> Unit?
) : RecyclerView.ViewHolder(view) {

    private val answerButton = view.findViewById<MarkdownTextView>(R.id.answer_button)!!
    private val overflowButton = view.findViewById<ImageButton>(R.id.overflow_button)!!
    private val orderView = view.findViewById<TextView>(R.id.answer_order)!!
    private val correctnessView = view.findViewById<MarkdownTextView>(R.id.answer_correctness)!!

    private var orderingController: OrderingController
    private var answer: QuizQuestion.Answer? = null
    private var isLastAnswer = false

    private val onOtherOptionSelected: (adapterPosition: Int, menuItemId: Int) -> Boolean =
        { adapterPosition: Int, menuItemId: Int ->
            if (menuItemId == R.id.delete_option) {
                onDelete.invoke(adapterPosition)
                true
            } else if (menuItemId == R.id.edit_option) {
                onEdit.invoke(adapterPosition)
                true
            }
            false
        }

    init {
        orderingController = OrderingController(
            overflowButton,
            R.menu.menu_edit_quiz_answer,
            /* canRemoveOrder= */ true,
            onChangeOrder,
            onOtherOptionSelected
        )
    }

    fun onBind(position: Int, answer: QuizQuestion.Answer, isLastAnswer: Boolean) {
        this.answer = answer
        this.isLastAnswer = isLastAnswer
        val res = orderView.resources
        orderingController.onBind(adapterPosition, answer.order, isLastAnswer)

        answerButton.text = if (answer.text.isEmpty()) {
            res.getString(R.string.quiz_answer_empty_text)
        } else {
            answer.text
        }
        answerButton.setOnClickListener {
            onEdit.invoke(position)
        }

        if (answer.order == -1) {
            orderView.text = res.getString(R.string.quiz_answer_order_text, "Ø")
        } else {
            orderView.text = res.getString(R.string.quiz_answer_order_text, answer.order.toString())
        }
        val correctness =
            if (answer.isCorrect) R.string.quiz_answer_correct_text else R.string.quiz_answer_incorrect_text
        correctnessView.text = res.getString(correctness)
    }
}