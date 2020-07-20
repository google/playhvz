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
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.app.playhvz.R
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.classmodels.QuizQuestion
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.firebase.viewmodels.QuizQuestionListViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.google.android.material.floatingactionbutton.FloatingActionButton

/** Fragment for going through the allegiance quiz.*/
class TakeQuizFragment : Fragment() {
    companion object {
        val TAG = TakeQuizFragment::class.qualifiedName
    }

    lateinit var gameViewModel: GameViewModel
    lateinit var questionViewModel: QuizQuestionListViewModel
    lateinit var fab: FloatingActionButton

    var gameId: String? = null
    var playerId: String? = null
    var game: Game? = null
    var player: Player? = null
    var questions: List<QuizQuestion> = listOf()

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
        setupObservers()
        setupToolbar()
        setupFab()
        return view
    }

    fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        if (toolbar != null) {
            toolbar.title = requireContext().getString(R.string.take_quiz_rules_title)
        }
    }

    private fun setupFab() {
        fab.visibility = View.GONE
    }

    private fun setupObservers() {
        if (gameId == null || playerId == null) {
            return
        }
        gameViewModel.getGameAndAdminObserver(this, gameId!!, playerId!!) {
            NavigationUtil.navigateToGameList(
                findNavController(),
                requireActivity()
            )
        }.observe(viewLifecycleOwner, androidx.lifecycle.Observer { serverGameAndAdminStatus ->
            updateGame(serverGameAndAdminStatus)
        })
        questionViewModel.getGameQuizQuestions(this, gameId!!)
            .observe(viewLifecycleOwner, androidx.lifecycle.Observer { questionList ->
                updateQuestionList(questionList)
            })
    }

    private fun updateGame(serverUpdate: GameViewModel.GameWithAdminStatus?) {
        if (serverUpdate == null) {
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
        }
        game = serverUpdate!!.game

    }

    private fun updateQuestionList(questions: List<QuizQuestion?>) {
        val clean = mutableListOf<QuizQuestion>()
        for (question in questions) {
            if (question != null) {
                clean.add(question)
            }
        }
        clean.sortBy { question -> question.index }
        this.questions = clean.toList()
    }
}