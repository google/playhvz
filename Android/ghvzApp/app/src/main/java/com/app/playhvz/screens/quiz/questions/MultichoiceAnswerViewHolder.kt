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

import android.content.Context
import android.view.MenuInflater
import android.view.MenuItem
import android.view.View
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.widget.PopupMenu
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.globals.CrossClientConstants.Companion.QUIZ_BLANK_ORDER
import com.app.playhvz.common.ui.MarkdownTextView
import com.app.playhvz.firebase.classmodels.QuizQuestion

class MultichoiceAnswerViewHolder(
    val context: Context,
    val view: View,
    val onEdit: (position: Int) -> Unit?,
    val onDelete: (position: Int) -> Unit?,
    val onChangeOrder: (position: Int, mod: OrderQuestionFragment.OrderModification) -> Unit?
) : RecyclerView.ViewHolder(view) {

    private val MOVE_UP_MENU_POSITION = 0
    private val REMOVE_ORDER_MENU_POSITION = 1
    private val MOVE_DOWN_MENU_POSITION = 2

    private val answerButton = view.findViewById<MarkdownTextView>(R.id.answer_button)!!
    private val overflowButton = view.findViewById<ImageButton>(R.id.overflow_button)!!
    private val orderView = view.findViewById<TextView>(R.id.answer_order)!!
    private val correctnessView = view.findViewById<MarkdownTextView>(R.id.answer_correctness)!!

    private var answer: QuizQuestion.Answer? = null
    private var isLastAnswer = false

    fun onBind(position: Int, answer: QuizQuestion.Answer, isLastAnswer: Boolean) {
        this.answer = answer
        this.isLastAnswer = isLastAnswer
        val res = orderView.resources
        overflowButton.setOnClickListener {
            triggerOverflowPopup()
        }
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

    private fun triggerOverflowPopup() {
        val popup = PopupMenu(context, overflowButton)
        val inflater: MenuInflater = popup.menuInflater
        inflater.inflate(R.menu.menu_edit_answer, popup.menu)
        if (answer?.order == 0 || answer?.order == QUIZ_BLANK_ORDER) {
            popup.menu.getItem(MOVE_UP_MENU_POSITION).isVisible = false
        }
        if (answer?.order == QUIZ_BLANK_ORDER) {
            popup.menu.getItem(REMOVE_ORDER_MENU_POSITION).isVisible = false
        }
        if (isLastAnswer && answer?.order != QUIZ_BLANK_ORDER) {
            // Allow this for the last blank-order option so that we can give it an order again.
            popup.menu.getItem(MOVE_DOWN_MENU_POSITION).isVisible = false
        }
        popup.setOnMenuItemClickListener { item -> handleOverflowPopupSelection(item) }
        popup.show()
    }

    private fun handleOverflowPopupSelection(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.move_up_option -> {
                onChangeOrder(adapterPosition, OrderQuestionFragment.OrderModification.MOVE_UP)
                return true
            }
            R.id.remove_order_option -> {
                onChangeOrder(adapterPosition, OrderQuestionFragment.OrderModification.REMOVE)
                return true
            }
            R.id.move_down_option -> {
                onChangeOrder(adapterPosition, OrderQuestionFragment.OrderModification.MOVE_DOWN)
                return true
            }
            R.id.delete_option -> {
                onDelete.invoke(adapterPosition)
                return true
            }
            else -> return false
        }
    }
}