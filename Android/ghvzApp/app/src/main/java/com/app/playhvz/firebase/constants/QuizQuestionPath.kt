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

package com.app.playhvz.firebase.constants

import com.google.firebase.firestore.Query

class QuizQuestionPath {
    companion object {
        /**
         * Top level collection name for Quiz Questions.
         */
        const val COLLECTION_PATH = "quizQuestions"

        /*******************************************************************************************
         * Begin string definitions for field names in Firebase documents. Alphabetize.
         ******************************************************************************************/


        /*******************************************************************************************
         * End string definitions for field names in Firebase documents.
         ******************************************************************************************/


        /*******************************************************************************************
         * Begin path definitions to documents. Alphabetize.
         ******************************************************************************************/

        /**
         * DocRef that navigates to Reward documents.
         */
        val QUIZ_QUESTION_COLLECTION = { gameId: String ->
            GamePath.GAMES_COLLECTION.document(gameId).collection(COLLECTION_PATH)
        }

        val QUIZ_QUESTION_DOCUMENT_REFERENCE = { gameId: String, questionId: String ->
            QUIZ_QUESTION_COLLECTION(gameId).document(questionId)
        }

        /*******************************************************************************************
         * End path definitions to documents
         ******************************************************************************************/
    }
}