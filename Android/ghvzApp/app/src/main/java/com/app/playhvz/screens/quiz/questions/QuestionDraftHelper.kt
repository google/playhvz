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
import android.view.View
import android.widget.ProgressBar
import androidx.navigation.NavController
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.globals.CrossClientConstants
import com.app.playhvz.firebase.classmodels.Question
import com.app.playhvz.firebase.operations.QuizQuestionDatabaseOperations
import com.app.playhvz.firebase.utils.DataConverterUtil
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.utils.SystemUtils
import com.google.android.gms.tasks.OnSuccessListener
import kotlinx.coroutines.runBlocking

class QuestionDraftHelper(
    private val context: Context,
    private val navController: NavController,
    private val gameId: String,
    private val questionId: String?
) {

    private lateinit var disableActions: () -> Unit
    private lateinit var enableActions: () -> Unit
    private lateinit var progressBar: ProgressBar

    var questionDraft: Question = Question()

    fun setProgressBar(progressBar: ProgressBar) {
        this.progressBar = progressBar
    }

    fun setEnableActions(enableActions: () -> Unit) {
        this.enableActions = enableActions
    }

    fun setDisableActions(disableActions: () -> Unit) {
        this.disableActions = disableActions
    }

    fun initializeDraft(type: String, nextIndex: Int, draftInitializedCallback: (draft: Question) -> Unit) {
        if (questionId == null) {
            questionDraft.type = type
            questionDraft.index = nextIndex
        } else {
            QuizQuestionDatabaseOperations.getQuizQuestionDocument(
                gameId,
                questionId,
                OnSuccessListener { document ->
                    questionDraft = DataConverterUtil.convertSnapshotToQuestion(document)
                    draftInitializedCallback.invoke(questionDraft)
                    enableActions.invoke()
                })
        }
    }

    fun setAnswers(draftAnswers: List<Question.Answer>) {
        val cleansed = mutableListOf<Question.Answer>()
        for (proposal in draftAnswers) {
            if (!proposal.text.isNullOrBlank()) {
                cleansed.add(proposal)
            }
        }
        questionDraft.answers = cleansed
    }

    fun persistDraftToServer() {
        progressBar.visibility = View.VISIBLE
        disableActions.invoke()
        runBlocking {
            EspressoIdlingResource.increment()
            if (questionId == null) {
                QuizQuestionDatabaseOperations.asyncCreateQuizQuestion(
                    gameId,
                    questionDraft,
                    {
                        progressBar.visibility = View.GONE
                        SystemUtils.showToast(context, "Created question.")
                        NavigationUtil.navigateToQuizDashboard(navController)
                    },
                    {
                        progressBar.visibility = View.GONE
                        enableActions()
                        SystemUtils.showToast(context, "Couldn't create question.")
                    }
                )

            } else {
                QuizQuestionDatabaseOperations.asyncUpdateQuizQuestion(
                    gameId,
                    questionId,
                    questionDraft,
                    {
                        SystemUtils.showToast(context, "Updated question!")
                        NavigationUtil.navigateToQuizDashboard(navController)
                    },
                    {
                        enableActions()
                        SystemUtils.showToast(context, "Couldn't update question.")
                    }
                )
            }
            EspressoIdlingResource.decrement()
        }
    }
}