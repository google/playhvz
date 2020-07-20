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

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.ui.MarkdownTextView
import com.app.playhvz.firebase.classmodels.QuizQuestion
import com.app.playhvz.screens.declareallegiance.OnCheckAnswersInterface
import com.app.playhvz.screens.declareallegiance.OnUpdateNextButtonInterface
import kotlin.random.Random

class DisplayMultiAnswerQuestionFragment(val question: QuizQuestion) : Fragment(),
    OnCheckAnswersInterface {
    companion object {
        val TAG = DisplayMultiAnswerQuestionFragment::class.qualifiedName
    }

    private lateinit var descriptionText: MarkdownTextView
    private lateinit var recyclerView: RecyclerView
    private lateinit var errorLabel: TextView
    private lateinit var successLabel: TextView
    private lateinit var answerAdapter: CorrectnessAnswerAdapter
    private var randomOrderAnswers: MutableList<QuizQuestion.Answer> = mutableListOf()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        randomOrderAnswers.addAll(question.answers)
        for (i in randomOrderAnswers.indices) {
            randomOrderAnswers[i].order = Random.nextInt(100 * randomOrderAnswers.size)
        }
        randomOrderAnswers = randomOrderAnswers.sortedBy { answer -> answer.order }.toMutableList()
        answerAdapter = CorrectnessAnswerAdapter(requireContext(), randomOrderAnswers)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view =
            inflater.inflate(R.layout.fragment_quiz_question_display_multi_answer, container, false)
        descriptionText = view.findViewById(R.id.description_text)
        errorLabel = view.findViewById(R.id.error_label)!!
        successLabel = view.findViewById(R.id.success_label)!!
        recyclerView = view.findViewById(R.id.answer_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(context)
        recyclerView.adapter = answerAdapter

        descriptionText.text = question.text
        return view
    }

    override fun checkAnswers() {
        val selectedAnswers = answerAdapter.getSelectedAnswers()

        var allCorrect = true
        for (i in randomOrderAnswers.indices) {
            val answer = randomOrderAnswers[i]
            if (answer.isCorrect && !selectedAnswers[i]) {
                allCorrect = false
            }
            if (selectedAnswers[i] && !answer.isCorrect) {
                allCorrect = false
            }
        }

        if (allCorrect) {
            successLabel.visibility = View.VISIBLE
            errorLabel.visibility = View.GONE
            allAnswersCorrect()
        } else {
            successLabel.visibility = View.GONE
            errorLabel.visibility = View.VISIBLE
        }
    }

    private fun allAnswersCorrect() {
        if (parentFragment is OnUpdateNextButtonInterface) {
            val onUpdateNextListener = parentFragment as OnUpdateNextButtonInterface
            onUpdateNextListener.enableNextButton(true)
        }
    }
}