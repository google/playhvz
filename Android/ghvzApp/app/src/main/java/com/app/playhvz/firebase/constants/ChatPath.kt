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

import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider

class ChatPath {
    companion object {
        /**
         * Top level collection name for Chat.
         */
        const val CHAT_COLLECTION_PATH = "chatRooms"

        /**
         * Top level collection name for chat messages.
         */
        const val MESSAGE_COLLECTION_PATH = "messages"

        /*******************************************************************************************
         * Begin string definitions for field names in Firebase documents. Alphabetize.
         ******************************************************************************************/

        /**
         * Field inside Chat document that contains the group id associated with the game.
         */
        const val CHAT_FIELD__GROUP_ID = "associatedGroupId"

        /*******************************************************************************************
         * End string definitions for field names in Firebase documents.
         ******************************************************************************************/


        /*******************************************************************************************
         * Begin path definitions to documents. Alphabetize.
         ******************************************************************************************/

        /**
         * DocRef that navigates to Chat documents.
         */
        val CHAT_COLLECTION = { gameId: String ->
            GamePath.GAMES_COLLECTION.document(gameId).collection(CHAT_COLLECTION_PATH)
        }

        val CHAT_QUERY =
            FirebaseProvider.getFirebaseFirestore().collectionGroup(CHAT_COLLECTION_PATH)

        val CHAT_DOCUMENT_REFERENCE = { gameId: String, chatRoomId: String ->
            CHAT_COLLECTION(gameId).document(chatRoomId)
        }

        /**
         * DocRef that navigates to Chat documents.
         */
        val MESSAGE_COLLECTION = { gameId: String, chatRoomId: String ->
            GamePath.GAMES_COLLECTION.document(gameId).collection(CHAT_COLLECTION_PATH)
                .document(chatRoomId).collection(MESSAGE_COLLECTION_PATH)
        }

        /*******************************************************************************************
         * End path definitions to documents
         ******************************************************************************************/
    }
}