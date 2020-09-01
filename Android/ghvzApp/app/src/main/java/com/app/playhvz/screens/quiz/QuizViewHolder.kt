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

package com.app.playhvz.screens.quiz

import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.content.res.AppCompatResources
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.emoji.widget.EmojiTextView
import androidx.navigation.NavController
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.globals.CrossClientConstants
import com.app.playhvz.common.globals.CrossClientConstants.Companion.QUIZ_TYPE_INFO
import com.app.playhvz.firebase.classmodels.QuizQuestion
import com.app.playhvz.navigation.NavigationUtil
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView

class QuizViewHolder(
    view: View,
    private val navController: NavController,
    onChangeOrder: (position: Int, modification: OrderingController.OrderModification) -> Unit?
) :
    RecyclerView.ViewHolder(view) {

    private var questionCard: MaterialCardView = view.findViewById(R.id.question_card)
    private var cardTitle: EmojiTextView = questionCard.findViewById(R.id.title)
    private var cardHeader: LinearLayout = questionCard.findViewById(R.id.card_header)
    private var cardHeaderIcon: MaterialButton = questionCard.findViewById(R.id.card_header_icon)
    private var cardContent: ConstraintLayout = questionCard.findViewById(R.id.card_content)
    private var questionText: EmojiTextView = questionCard.findViewById(R.id.question_text)
    private var answerCountText: TextView = questionCard.findViewById(R.id.answer_count)
    private var questionTypeText: TextView = questionCard.findViewById(R.id.question_type)
    private var orderingController: OrderingController

    private lateinit var question: QuizQuestion

    private val onOtherOptionSelected: (adapterPosition: Int, menuItemId: Int) -> Boolean =
        { _: Int, menuItemId: Int ->
            if (menuItemId == R.id.edit_option) {
                navigateToQuestionSettings()
            }
            true
        }

    init {
        cardHeader.setOnClickListener {
            if (cardContent.visibility == View.VISIBLE) {
                // Collapse the card content
                cardContent.visibility = View.GONE
            } else {
                // Display the card content
                cardContent.visibility = View.VISIBLE
            }
        }
        orderingController = OrderingController(
            cardHeaderIcon,
            R.menu.menu_edit_quiz_question,
            /* canRemoveOrder= */false,
            onChangeOrder,
            onOtherOptionSelected
        )
    }

    fun onBind(question: QuizQuestion, isAdmin: Boolean, isLast: Boolean) {
        this.question = question
        val res = cardTitle.resources
        orderingController.onBind(adapterPosition, question.index!!, isLast)
        if (isAdmin) {
            cardHeaderIcon.visibility = View.VISIBLE
            cardHeaderIcon.icon =
                AppCompatResources.getDrawable(cardHeaderIcon.context, R.drawable.ic_more)
        } else {
            cardHeaderIcon.visibility = View.GONE
        }

        cardTitle.text = res.getString(R.string.quiz_card_title, question.index.toString())
        questionText.text = question.text
        answerCountText.visibility =
            if (question.type == QUIZ_TYPE_INFO) View.GONE else View.VISIBLE
        answerCountText.text =
            res.getString(R.string.quiz_dashboard_answer_count, question.answers.size)
        questionTypeText.text = question.type
    }

    private fun navigateToQuestionSettings() {
        when (question.type) {
            CrossClientConstants.QUIZ_TYPE_MULTIPLE_CHOICE -> {
                NavigationUtil.navigateToQuizMultipleChoiceQuestion(
                    navController,
                    question.id,
                    -1
                )
            }
            CrossClientConstants.QUIZ_TYPE_TRUE_FALSE -> {
                NavigationUtil.navigateToQuizTrueFalseQuestion(
                    navController,
                    question.id,
                    -1
                )
            }
            CrossClientConstants.QUIZ_TYPE_ORDER -> {
                NavigationUtil.navigateToQuizOrderQuestion(
                    navController,
                    question.id,
                    -1
                )
            }
            else -> {
                NavigationUtil.navigateToQuizInfoQuestion(
                    navController,
                    question.id,
                    -1
                )
            }
        }
    }
}