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

package com.app.playhvz.firebase.operations

import android.util.Log
import com.app.playhvz.firebase.classmodels.QuizQuestion
import com.app.playhvz.firebase.classmodels.QuizQuestion.Companion.FIELD__INDEX
import com.app.playhvz.firebase.constants.QuizQuestionPath
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.firebase.utils.FirebaseDatabaseUtil
import com.google.android.gms.tasks.OnSuccessListener
import com.google.firebase.firestore.CollectionReference
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.DocumentSnapshot
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext


class QuizQuestionDatabaseOperations {
    companion object {
        private val TAG = QuizQuestionDatabaseOperations::class.qualifiedName

        /** Returns a collection reference to the given gameId. */
        fun getQuizQuestionCollectionReference(
            gameId: String
        ): CollectionReference {
            return QuizQuestionPath.QUIZ_QUESTION_COLLECTION(gameId)
        }

        /** Returns a document reference to the given questionId. */
        fun getQuizQuestionDocumentReference(
            gameId: String,
            questionId: String
        ): DocumentReference {
            return QuizQuestionPath.QUIZ_QUESTION_DOCUMENT_REFERENCE(gameId, questionId)
        }

        fun getQuizQuestionDocument(
            gameId: String,
            questionId: String,
            onSuccessListener: OnSuccessListener<DocumentSnapshot>
        ) {
            FirebaseDatabaseUtil.optimizedGet(
                QuizQuestionPath.QUIZ_QUESTION_DOCUMENT_REFERENCE(
                    gameId,
                    questionId
                ), onSuccessListener
            )
        }

        suspend fun asyncCreateQuizQuestion(
            gameId: String,
            questionDraft: QuizQuestion,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            QuizQuestionPath.QUIZ_QUESTION_COLLECTION(gameId).add(
                QuizQuestion.createFirebaseObject(questionDraft)
            ).addOnSuccessListener {
                successListener.invoke()
            }.addOnFailureListener {
                Log.e(TAG, "Failed to create quiz question: " + it)
                failureListener.invoke()
            }
        }

        suspend fun asyncUpdateQuizQuestion(
            gameId: String,
            questionId: String,
            questionDraft: QuizQuestion,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            QuizQuestionPath.QUIZ_QUESTION_DOCUMENT_REFERENCE(gameId, questionId).set(
                QuizQuestion.createFirebaseObject(questionDraft)
            ).addOnSuccessListener {
                successListener.invoke()
            }.addOnFailureListener {
                Log.e(TAG, "Failed to update quiz question: " + it)
                failureListener.invoke()
            }
        }

        /** Permanently deletes question. */
        suspend fun asyncDeleteQuestion(
            gameId: String,
            questionId: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "questionId" to questionId
            )
            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("deleteQuizQuestion")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

        suspend fun swapQuestionIndexes(
            gameId: String,
            question1: QuizQuestion,
            question2: QuizQuestion
        ) {
            val newQuestion1Index = question2.index!!
            val newQuestion2Index = question1.index!!

            val question1DocRef = getQuizQuestionDocumentReference(gameId, question1.id!!)
            val question2DocRef = getQuizQuestionDocumentReference(gameId, question2.id!!)

            FirebaseProvider.getFirebaseFirestore().runTransaction { transaction ->
                transaction.update(question1DocRef, FIELD__INDEX, newQuestion1Index)
                transaction.update(question2DocRef, FIELD__INDEX, newQuestion2Index)
                null
            }.addOnSuccessListener { Log.d(TAG, "Transaction success!") }
                .addOnFailureListener { e -> Log.w(TAG, "Transaction failure.", e) }
        }
    }
}