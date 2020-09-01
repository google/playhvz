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

package com.app.playhvz.screens.declareallegiance

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.content.res.AppCompatResources
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentTransaction
import androidx.lifecycle.LiveData
import androidx.navigation.fragment.findNavController
import com.app.playhvz.R
import com.app.playhvz.common.globals.CrossClientConstants.Companion.QUIZ_TYPE_INFO
import com.app.playhvz.common.globals.CrossClientConstants.Companion.QUIZ_TYPE_MULTIPLE_CHOICE
import com.app.playhvz.common.globals.CrossClientConstants.Companion.QUIZ_TYPE_ORDER
import com.app.playhvz.common.globals.CrossClientConstants.Companion.QUIZ_TYPE_TRUE_FALSE
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.classmodels.QuizQuestion
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.firebase.viewmodels.QuizQuestionListViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.screens.quiz.displayquestions.DisplayInfoQuestionFragment
import com.app.playhvz.screens.quiz.displayquestions.DisplayMultiAnswerQuestionFragment
import com.app.playhvz.screens.quiz.displayquestions.DisplayOrderAnswerQuestionFragment
import com.google.android.material.button.MaterialButton
import com.google.android.material.floatingactionbutton.FloatingActionButton

/** Fragment for going through the allegiance quiz.*/
class TakeQuizFragment : Fragment(), OnUpdateNextButtonInterface {
    companion object {
        val TAG = TakeQuizFragment::class.qualifiedName
    }

    private lateinit var gameViewModel: GameViewModel
    private lateinit var questionViewModel: QuizQuestionListViewModel
    private lateinit var fab: FloatingActionButton
    private lateinit var checkAnswersButton: MaterialButton
    private lateinit var helpButton: MaterialButton
    private lateinit var nextButton: MaterialButton
    private lateinit var loadingSpinner: ProgressBar
    private lateinit var quizQuestionLiveData: LiveData<List<QuizQuestion>>


    var currentOnCheckAnswersListener: OnCheckAnswersInterface? = null
    var gameId: String? = null
    var playerId: String? = null
    var game: Game? = null
    var player: Player? = null
    var questions: List<QuizQuestion> = listOf()
    var currentlyDisplayedQuestion = -1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameViewModel = GameViewModel()
        questionViewModel = QuizQuestionListViewModel()
        gameId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_GAME_ID, null)
        playerId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_PLAYER_ID, null)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_take_allegiance_quiz, container, false)
        fab = activity?.findViewById(R.id.floating_action_button)!!
        loadingSpinner = view.findViewById(R.id.progress_bar)
        helpButton = view.findViewById(R.id.help_button)
        checkAnswersButton = view.findViewById(R.id.check_answers_button)
        nextButton = view.findViewById(R.id.next_button)

        checkAnswersButton.setOnClickListener {
            if (currentOnCheckAnswersListener == null) {
                return@setOnClickListener
            }
            currentOnCheckAnswersListener!!.checkAnswers()
        }

        nextButton.setOnClickListener {
            showNextQuestion()
        }

        setupObservers()
        setupToolbar()
        setupFab()
        return view
    }

    fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        if (toolbar != null) {
            toolbar.title = requireContext().getString(R.string.take_quiz_title)
        }
    }

    private fun setupFab() {
        fab.visibility = View.GONE
    }

    private fun setupObservers() {
        if (gameId == null || playerId == null) {
            return
        }
        gameViewModel.getGameAndAdminObserver(this, gameId!!, playerId!!)
            .observe(viewLifecycleOwner, androidx.lifecycle.Observer { serverGameAndAdminStatus ->
                updateGame(serverGameAndAdminStatus)
            })
        quizQuestionLiveData = questionViewModel.getGameQuizQuestions(gameId!!)
        var allowedUpdates = 2
        quizQuestionLiveData.observe(
            viewLifecycleOwner,
            androidx.lifecycle.Observer { questionList ->
                allowedUpdates--
                updateQuestionList(questionList, allowedUpdates)
            })
    }

    private fun updateGame(serverUpdate: GameViewModel.GameWithAdminStatus?) {
        if (serverUpdate == null) {
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
        }
        game = serverUpdate!!.game

    }

    private fun updateQuestionList(questions: List<QuizQuestion?>, allowedUpdates: Int) {
        if (allowedUpdates == 1) {
            return
        } else if (allowedUpdates == 0) {
            // The first update is always an emptylivedata, wait to remove the observer until after
            // our second update.
            loadingSpinner.visibility = View.GONE
            quizQuestionLiveData.removeObservers(viewLifecycleOwner)
        }
        val clean = mutableListOf<QuizQuestion>()
        for (question in questions) {
            if (question != null) {
                clean.add(question)
            }
        }
        clean.sortBy { question -> question.index }
        this.questions = clean.toList()
        if (this.questions.isEmpty()) {
            showAllegianceScreen()
        } else {
            showNextQuestion()
        }
    }

    private fun showNextQuestion() {
        currentlyDisplayedQuestion++
        if (currentlyDisplayedQuestion >= questions.size) {
            showAllegianceScreen()
            return
        }
        var childFragment: Fragment? = null
        val question = questions[currentlyDisplayedQuestion]
        when (question.type) {
            QUIZ_TYPE_INFO -> {
                childFragment = DisplayInfoQuestionFragment(question)
            }
            QUIZ_TYPE_MULTIPLE_CHOICE -> {
                childFragment = DisplayMultiAnswerQuestionFragment(question)
            }
            QUIZ_TYPE_TRUE_FALSE -> {
                childFragment = DisplayMultiAnswerQuestionFragment(question)
            }
            QUIZ_TYPE_ORDER -> {
                childFragment = DisplayOrderAnswerQuestionFragment(question)
            }
        }

        currentOnCheckAnswersListener = if (childFragment is OnCheckAnswersInterface) {
            childFragment
        } else {
            null
        }

        val transaction: FragmentTransaction = childFragmentManager.beginTransaction()
        transaction.replace(R.id.quiz_question_display_container, childFragment!!).commit()
        enableNextButton(false)
    }

    private fun showAllegianceScreen() {
        currentOnCheckAnswersListener = null
        nextButton.setOnClickListener { }
        nextButton.icon = AppCompatResources.getDrawable(requireContext(), R.drawable.ic_check)
        val childFragment: Fragment = DeclareAllegianceFragment()
        val transaction: FragmentTransaction = childFragmentManager.beginTransaction()
        transaction.replace(R.id.quiz_question_display_container, childFragment).commit()
    }

    override fun enableNextButton(canEnableButton: Boolean) {
        if (canEnableButton) {
            checkAnswersButton.isEnabled = false
            nextButton.isEnabled = true
        } else {
            checkAnswersButton.isEnabled = true
            nextButton.isEnabled = false
        }
    }
}