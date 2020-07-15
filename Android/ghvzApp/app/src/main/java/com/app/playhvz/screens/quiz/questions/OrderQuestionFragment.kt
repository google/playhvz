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

import android.os.Bundle
import android.view.*
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doOnTextChanged
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.ConfirmationDialog
import com.app.playhvz.common.globals.CrossClientConstants
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.common.ui.MarkdownEditText
import com.app.playhvz.firebase.classmodels.QuizQuestion
import com.app.playhvz.utils.SystemUtils

class OrderQuestionFragment : Fragment() {
    companion object {
        val TAG = OrderQuestionFragment::class.qualifiedName
    }

    enum class OrderModification {
        MOVE_UP,
        REMOVE,
        MOVE_DOWN
    }

    val args: OrderQuestionFragmentArgs by navArgs()

    private lateinit var answerAdapter: MultichoiceAnswerAdapter
    private lateinit var answerRecyclerView: RecyclerView
    private lateinit var descriptionText: MarkdownEditText
    private lateinit var draftHelper: QuestionDraftHelper
    private lateinit var progressBar: ProgressBar
    private lateinit var toolbarMenu: Menu

    private var gameId: String? = null
    private var playerId: String? = null
    private var currentAnswers: MutableList<QuizQuestion.Answer> = mutableListOf()

    private val onAddAnswer = {
        val newAnswer = QuizQuestion.Answer()
        newAnswer.order = currentAnswers.size
        currentAnswers.add(newAnswer)
        refreshAnswers()
    }
    private val onEditAnswer = { position: Int ->
        val onUpdate =
            { updatedAnswer: QuizQuestion.Answer ->
                currentAnswers[position] = updatedAnswer
                refreshAnswers()
            }
        val dialog = AnswerDialog(currentAnswers[position], onUpdate)
        activity?.supportFragmentManager?.let { dialog.show(it, TAG) }
    }
    private val onDeleteAnswer = { position: Int ->
        val confirmationDialog = ConfirmationDialog(
            getString(R.string.collapsible_section_remove_dialog_title),
            R.string.collapsible_section_remove_dialog_content,
            R.string.delete_button_content_description
        )
        confirmationDialog.setPositiveButtonCallback {
            currentAnswers.removeAt(position)
            refreshAnswers()
        }
        activity?.supportFragmentManager?.let {
            confirmationDialog.show(
                it,
                TAG
            )
        }
    }
    private val onChangeAnswerOrder = { position: Int, modification: OrderModification ->
        val currentOrdering = currentAnswers[position].order
        if (modification == OrderModification.REMOVE) {
            currentAnswers[position].order = CrossClientConstants.QUIZ_BLANK_ORDER
            for (index in 0 until currentAnswers.size) {
                if (currentAnswers[index].order < currentOrdering) {
                    continue
                }
                currentAnswers[index].order--
            }
        } else if (modification == OrderModification.MOVE_UP) {
            val targetOrdering = currentOrdering - 1
            swapAnswers(position, targetOrdering)
        } else if (modification == OrderModification.MOVE_DOWN) {
            if (currentAnswers[position].order == CrossClientConstants.QUIZ_BLANK_ORDER) {
                for (index in 0 until currentAnswers.size) {
                    if (currentAnswers[index].order < 0) {
                        continue
                    }
                    currentAnswers[index].order++
                }
                currentAnswers[position].order = 0
            } else {
                val targetOrdering = currentOrdering + 1
                swapAnswers(position, targetOrdering)
            }
        }
        refreshAnswers()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_GAME_ID, null)
        playerId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_PLAYER_ID, null)
        answerAdapter =
            MultichoiceAnswerAdapter(
                listOf(),
                this,
                onAddAnswer,
                onEditAnswer,
                onDeleteAnswer,
                onChangeAnswerOrder
            )
        setHasOptionsMenu(true)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_quiz_question_order, container, false)
        progressBar = view.findViewById(R.id.progress_bar)
        descriptionText = view.findViewById(R.id.description_text)
        answerRecyclerView = view.findViewById(R.id.item_list)
        answerRecyclerView.layoutManager = LinearLayoutManager(context)
        answerRecyclerView.adapter = answerAdapter

        descriptionText.doOnTextChanged { text, _, _, _ ->
            when {
                text.isNullOrEmpty() -> {
                    disableActions()
                }
                else -> {
                    enableActions()
                }
            }
        }
        setupToolbar()
        setupDraftHelper()
        return view
    }

    override fun onCreateOptionsMenu(menu: Menu, inflater: MenuInflater) {
        inflater.inflate(R.menu.menu_save_settings, menu)
        toolbarMenu = menu
        disableActions()
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == R.id.save_option) {
            saveChanges()
        }
        return super.onOptionsItemSelected(item)
    }

    override fun onPause() {
        super.onPause()
        SystemUtils.hideKeyboard(requireContext())
    }

    override fun onResume() {
        super.onResume()
        descriptionText.clearFocus()
    }

    private fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        if (toolbar != null) {
            toolbar.title = requireContext().getString(R.string.quiz_order_question_title)
        }
    }

    private fun setupDraftHelper() {
        draftHelper =
            QuestionDraftHelper(requireContext(), findNavController(), gameId!!, args.questionId)
        draftHelper.setDisableActions {
            disableActions()
        }
        draftHelper.setEnableActions {
            enableActions()
        }
        draftHelper.setProgressBar(progressBar)
        draftHelper.initializeDraft(
            CrossClientConstants.QUIZ_TYPE_ORDER,
            args.nextAvailableIndex,
            { draft -> initUI(draft) })
    }

    private fun initUI(draft: QuizQuestion) {
        descriptionText.setText(draft.text)
        currentAnswers = draft.answers.toMutableList()
        refreshAnswers()
    }

    private fun saveChanges() {
        val info = descriptionText.text.toString()
        draftHelper.questionDraft.text = info
        draftHelper.setAnswers(currentAnswers)
        draftHelper.persistDraftToServer()
    }

    private fun disableActions() {
        SystemUtils.hideKeyboard(requireContext())
        val menuItem = toolbarMenu.findItem(R.id.save_option)
        menuItem.icon.mutate().alpha = 130
        menuItem.isEnabled = false
    }

    private fun enableActions() {
        if (view == null || toolbarMenu.findItem(R.id.save_option) == null) {
            // Fragment was killed
            return
        }
        val menuItem = toolbarMenu.findItem(R.id.save_option)
        menuItem.icon.mutate().alpha = 255
        menuItem.isEnabled = true
    }

    private fun refreshAnswers() {
        currentAnswers = currentAnswers.sortedBy { answer -> answer.order }.toMutableList()
        answerAdapter.setData(currentAnswers)
        answerAdapter.notifyDataSetChanged()
    }

    private fun swapAnswers(currentPostion: Int, endingOrder: Int) {
        for ((index, value) in currentAnswers.withIndex()) {
            if (value.order == endingOrder) {
                currentAnswers[index].order = currentAnswers[currentPostion].order
                currentAnswers[currentPostion].order = endingOrder
                return
            }
        }
    }
}