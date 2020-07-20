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
import androidx.fragment.app.Fragment
import com.app.playhvz.R
import com.app.playhvz.common.ui.MarkdownTextView
import com.app.playhvz.firebase.classmodels.QuizQuestion
import com.app.playhvz.screens.declareallegiance.OnCheckAnswersInterface
import com.app.playhvz.screens.declareallegiance.OnUpdateNextButtonInterface

class DisplayInfoQuestionFragment(val question: QuizQuestion) : Fragment(),
    OnCheckAnswersInterface {
    companion object {
        val TAG = DisplayInfoQuestionFragment::class.qualifiedName
    }

    private lateinit var descriptionText: MarkdownTextView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_quiz_question_display_info, container, false)
        descriptionText = view.findViewById(R.id.description_text)
        descriptionText.text = question.text
        noAnswersToCheck()
        return view
    }

    override fun checkAnswers() {
        noAnswersToCheck()
    }

    private fun noAnswersToCheck() {
        if (parentFragment is OnUpdateNextButtonInterface) {
            val onUpdateNextListener = parentFragment as OnUpdateNextButtonInterface
            onUpdateNextListener.enableNextButton(/* canEnableButton= */ true)
        }
    }
}