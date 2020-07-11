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
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.emoji.widget.EmojiTextView
import androidx.fragment.app.FragmentActivity
import androidx.navigation.NavController
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.globals.CrossClientConstants
import com.app.playhvz.firebase.classmodels.Question
import com.app.playhvz.navigation.NavigationUtil
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView

class QuizViewHolder(
    private val activity: FragmentActivity,
    private val gameId: String,
    view: View,
    private val navController: NavController
) :
    RecyclerView.ViewHolder(view) {

    private var questionCard: MaterialCardView = view.findViewById(R.id.question_card)
    private var cardTitle: EmojiTextView = questionCard.findViewById(R.id.title)
    private var cardHeader: LinearLayout = questionCard.findViewById(R.id.card_header)
    private var cardHeaderIcon: MaterialButton = questionCard.findViewById(R.id.card_header_icon)
    private var cardContent: ConstraintLayout = questionCard.findViewById(R.id.card_content)
    private var questionText: EmojiTextView = questionCard.findViewById(R.id.question_text)

    private lateinit var question: Question

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
    }

    fun onBind(question: Question, isAdmin: Boolean) {
        this.question = question
        if (isAdmin) {
            cardHeaderIcon.visibility = View.VISIBLE
            cardHeaderIcon.setOnClickListener {
                navigateToQuestionSettings()
            }
        } else {
            cardHeaderIcon.visibility = View.GONE
        }



        cardTitle.text =
            cardTitle.resources.getString(R.string.quiz_card_title, question.index.toString())
        questionText.text = question.text
    }

    private fun navigateToQuestionSettings() {
        when (question.type) {
            CrossClientConstants.QUIZ_TYPE_MULTIPLE_CHOICE -> {

            }
            CrossClientConstants.QUIZ_TYPE_TRUE_FALSE -> {

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