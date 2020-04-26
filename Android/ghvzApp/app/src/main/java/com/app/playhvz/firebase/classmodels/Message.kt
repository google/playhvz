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

import com.google.firebase.Timestamp
import com.google.firebase.firestore.ServerTimestamp
import java.util.*
import kotlin.collections.HashMap

/** Android data model representing Firebase Chat Message documents. */
class Message {
    companion object {
        const val FIELD__MESSAGE = "message"
        const val FIELD__SENDER_ID = "senderId"
        const val FIELD__TIMESTAMP = "timestamp"

        fun createFirebaseObject(senderId: String, messageText: String): HashMap<String, Any> {
            val data = HashMap<String, Any>()
            data[FIELD__SENDER_ID] = senderId
            data[FIELD__MESSAGE] = messageText
            // To let the server set the timestamp use: FieldValue.serverTimestamp()
            // We're setting the timestamp to the local time, otherwise firebase triggers and update
            // for the message and another update for the timestamp. That's a lot of refreshes for
            // chat, so prefer to use local timestamp and only update once.
            data[FIELD__TIMESTAMP] = Timestamp(Date())
            return data
        }
    }

    var id: String? = null

    var message: String = ""
    var senderId: String = ""
    @ServerTimestamp
    var timestamp: Timestamp? = null
}