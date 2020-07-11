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

package com.app.playhvz.firebase.classmodels

/** Android data model representing Firebase Reward documents. */
class Question {
    companion object {
        const val FIELD__INDEX = "index"
        const val FIELD__TYPE = "type"
        const val FIELD__TEXT = "text"
        const val FIELD__ANSWERS = "answers"
        const val FIELD__ANSWER_TEXT = "text"
        const val FIELD__ANSWER_ORDER = "order"
        const val FIELD__ANSWER_IS_CORRECT = "isCorrect"

        fun createFirebaseObject(questionDraft: Question): HashMap<String, Any?> {
            val data = HashMap<String, Any?>()
            data[FIELD__INDEX] = questionDraft.index
            data[FIELD__TYPE] = questionDraft.type
            data[FIELD__TEXT] = questionDraft.text
            data[FIELD__ANSWERS] = questionDraft.answers
            return data
        }
    }

    var id: String? = null
    var index: Int? = null
    var type: String? = null
    var text: String? = null
    var answers: List<Answer> = listOf()

    inner class Answer() {
        var text: String? = null
        var order: Int? = null
        var isCorrect: Boolean = true
    }
}