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
import com.google.firebase.firestore.DocumentReference

class PlayerPath {
    companion object {
        /*******************************************************************************************
         * String definitions for collection names. Alphabetize.
         ******************************************************************************************/

        /**
         * Top level collection name for Players.
         */
        const val PLAYER_COLLECTION_PATH = "players"

        /*******************************************************************************************
         * Begin string definitions for field names in Firebase documents. Alphabetize.
         ******************************************************************************************/

        /**
         * Field inside Player document that contains the name of the player.
         */
        const val PLAYER_FIELD__NAME = "name"

        const val PLAYER_FIELD__CHAT_MEMBERSHIPS = "chatRoomMemberships"

        const val PLAYER_FIELD__LIVES = "lives"

        const val PLAYER_FIELD__LIFE_CODE = "lifeCode"

        const val PLAYER_FIELD__LIFE_CODE_STATUS = "isActive"

        const val PLAYER_FIELD__LIFE_CODE_TIMESTAMP = "created"

        /*******************************************************************************************
         * End string definitions for field names in Firebase documents.
         ******************************************************************************************/

        /*******************************************************************************************
         * Begin path definitions to documents. Alphabetize.
         ******************************************************************************************/

        /**
         * DocRef that navigates to a Game's Player collection documents.
         */
        val PLAYERS_COLLECTION = { gameId: String ->
            GamePath.GAMES_COLLECTION.document(gameId).collection(PLAYER_COLLECTION_PATH)
        }

        val PLAYERS_QUERY =
            FirebaseProvider.getFirebaseFirestore().collectionGroup(PLAYER_COLLECTION_PATH)


        /*******************************************************************************************
         * End path definitions to documents
         ******************************************************************************************/
    }
}