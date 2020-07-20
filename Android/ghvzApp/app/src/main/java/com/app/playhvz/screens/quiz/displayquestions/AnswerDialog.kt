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

import android.app.AlertDialog
import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Spinner
import androidx.emoji.widget.EmojiEditText
import androidx.fragment.app.DialogFragment
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.QuizQuestion
import com.app.playhvz.screens.quiz.editablequestions.AnswerDialog
import com.google.android.material.button.MaterialButton

class AnswerDialog(
    private val answer: QuizQuestion.Answer,
    private val onUpdate: (updatedAnswer: QuizQuestion.Answer) -> Unit,
    private val canEditText: Boolean = true
) : DialogFragment() {
    companion object {
        private val TAG = AnswerDialog::class.qualifiedName
    }

    private val CORRECT_POSITION = 0
    private val INCORRECT_POSITION = 1

    private lateinit var customView: View
    private lateinit var answerText: EmojiEditText
    private lateinit var answerCorrectness: Spinner

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        customView =
            requireActivity().layoutInflater.inflate(R.layout.dialog_quiz_answer, null)
        answerText = customView.findViewById(R.id.answer_text)
        answerCorrectness = customView.findViewById(R.id.answer_correctness_spinner)

        answerText.isEnabled = canEditText

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle(resources.getString(R.string.quiz_answer_dialog_title))
            .setView(customView)
            .create()

        val negativeButton = customView.findViewById<MaterialButton>(R.id.negative_button)
        negativeButton.setOnClickListener {
            dialog?.dismiss()
        }
        val positiveButton = customView.findViewById<MaterialButton>(R.id.positive_button)
        positiveButton.setOnClickListener {
            answer.text = answerText.text.toString()
            answer.isCorrect = answerCorrectness.selectedItemPosition == CORRECT_POSITION
            onUpdate.invoke(answer)
            dialog?.dismiss()
        }

        val correctnessOptions = arrayOf(
            resources.getString(R.string.boolean_correct),
            resources.getString(R.string.boolean_incorrect)
        )
        ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_item,
            correctnessOptions
        ).also { correctnessAdapter: ArrayAdapter<String> ->
            correctnessAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
            answerCorrectness.adapter = correctnessAdapter
        }

        return dialog
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        initView()
        // Return already inflated custom view
        return customView
    }

    private fun initView() {
        answerText.setText(answer.text)
        answerCorrectness.setSelection(if (answer.isCorrect) CORRECT_POSITION else INCORRECT_POSITION)
    }
}