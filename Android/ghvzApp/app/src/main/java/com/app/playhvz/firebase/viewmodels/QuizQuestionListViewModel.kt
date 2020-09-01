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

package com.app.playhvz.firebase.viewmodels

import android.util.Log
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ViewModel
import com.app.playhvz.app.HvzData
import com.app.playhvz.firebase.classmodels.QuizQuestion
import com.app.playhvz.firebase.operations.QuizQuestionDatabaseOperations
import com.app.playhvz.firebase.utils.DataConverterUtil

class QuizQuestionListViewModel : ViewModel() {
    companion object {
        private val TAG = QuizQuestionListViewModel::class.qualifiedName
    }

    private var questionList: HvzData<List<QuizQuestion>> = HvzData(listOf())

    /** Listens to all question updates and returns a LiveData object. */
    fun getGameQuizQuestions(
        gameId: String
    ): HvzData<List<QuizQuestion>> {
        questionList.docIdListeners[gameId] =
            QuizQuestionDatabaseOperations.getQuizQuestionCollectionReference(gameId)
                .addSnapshotListener { querySnapshot, e ->
                    if (e != null) {
                        Log.w(TAG, "Listen to quiz question collection failed. ", e)
                        questionList.value = emptyList()
                        return@addSnapshotListener
                    }
                    if (querySnapshot == null || querySnapshot.isEmpty || querySnapshot.documents.isEmpty()) {
                        questionList.value = emptyList()
                        return@addSnapshotListener
                    }
                    val updatedList: MutableList<QuizQuestion> = mutableListOf()
                    for (questionSnapshot in querySnapshot.documents) {
                        updatedList.add(DataConverterUtil.convertSnapshotToQuestion(questionSnapshot))
                    }
                    questionList.value = updatedList
                }
        return questionList
    }
}