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

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.classmodels.QuizQuestion
import com.app.playhvz.firebase.operations.QuizQuestionDatabaseOperations
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.firebase.viewmodels.QuizQuestionListViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.google.android.material.floatingactionbutton.FloatingActionButton
import kotlinx.coroutines.runBlocking

/** Fragment for showing a list of rewards.*/
class QuizDashboardFragment : Fragment() {
    companion object {
        val TAG = QuizDashboardFragment::class.qualifiedName
    }

    lateinit var gameViewModel: GameViewModel
    lateinit var questionViewModel: QuizQuestionListViewModel
    lateinit var fab: FloatingActionButton
    lateinit var recyclerView: RecyclerView
    lateinit var adapter: QuizDashboardAdapter

    var gameId: String? = null
    var playerId: String? = null
    var game: Game? = null
    var player: Player? = null
    var questions: List<QuizQuestion> = listOf()

    private val onChangeAnswerOrder =
        { position: Int, modification: OrderingController.OrderModification ->
            val currentOrdering = questions[position].index!!
            if (modification == OrderingController.OrderModification.MOVE_UP) {
                val targetOrdering = currentOrdering - 1
                swapQuestions(position, targetOrdering)
            } else if (modification == OrderingController.OrderModification.MOVE_DOWN) {
                val targetOrdering = currentOrdering + 1
                swapQuestions(position, targetOrdering)
            }
        }

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
        val view = inflater.inflate(R.layout.fragment_quiz_question_dashboard, container, false)
        fab = activity?.findViewById(R.id.floating_action_button)!!
        recyclerView = view.findViewById(R.id.question_list)
        adapter = QuizDashboardAdapter(
            listOf(),
            requireContext(),
            findNavController(),
            onChangeAnswerOrder
        )
        recyclerView.layoutManager = LinearLayoutManager(context)
        recyclerView.adapter = adapter
        setupObservers()
        setupToolbar()
        return view
    }

    fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        if (toolbar != null) {
            toolbar.title = requireContext().getString(R.string.quiz_dashboard_title)
        }
    }

    private fun setupFab(isAdmin: Boolean) {
        if (!isAdmin) {
            fab.visibility = View.GONE
            return
        }
        fab.visibility = View.VISIBLE
        fab.setOnClickListener {
            selectQuestionType()
        }
        fab.visibility = View.VISIBLE
    }

    private fun setupObservers() {
        if (gameId == null || playerId == null) {
            return
        }
        gameViewModel.getGameAndAdminObserver(this, gameId!!, playerId!!)
            .observe(viewLifecycleOwner, androidx.lifecycle.Observer { serverGameAndAdminStatus ->
                updateGame(serverGameAndAdminStatus)
            })
        questionViewModel.getGameQuizQuestions(gameId!!)
            .observe(viewLifecycleOwner, androidx.lifecycle.Observer { questionList ->
                updateQuestionList(questionList)
            })
    }

    private fun updateGame(serverUpdate: GameViewModel.GameWithAdminStatus?) {
        if (serverUpdate == null) {
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
        }
        game = serverUpdate!!.game
        setupFab(serverUpdate.isAdmin)
        adapter.setIsAdmin(serverUpdate.isAdmin)
        adapter.notifyDataSetChanged()
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
        adapter.setData(this.questions)
        adapter.notifyDataSetChanged()
    }

    private fun selectQuestionType() {
        val dialog = QuestionTypeSelectorDialog(gameId!!, adapter.itemCount)
        activity?.supportFragmentManager?.let { dialog.show(it, TAG) }
    }

    private fun swapQuestions(currentPostion: Int, endingOrder: Int) {
        for ((index, value) in questions.withIndex()) {
            if (value.index == endingOrder) {
                runBlocking {
                    EspressoIdlingResource.increment()
                    QuizQuestionDatabaseOperations.swapQuestionIndexes(
                        gameId!!,
                        questions[currentPostion],
                        questions[index]
                    )
                    EspressoIdlingResource.decrement()
                }
                return
            }
        }
    }
}