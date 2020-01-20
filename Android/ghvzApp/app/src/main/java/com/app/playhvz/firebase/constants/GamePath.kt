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

class GamePath {
    companion object {
        /*******************************************************************************************
         * String definitions for collection names. Alphabetize.
         ******************************************************************************************/

        /**
         * Top level collection name for Players.
         */
        const val GAME_COLLECTION_PATH = "games"

        /*******************************************************************************************
         * Begin string definitions for field names in Firebase documents. Alphabetize.
         ******************************************************************************************/

        /**
         * Field inside Game document that contains the name of the game.
         */
        const val GAME_FIELD__NAME = "name"

        /**
         * Field inside Game document that contains the uid of the user who created the game.
         */
        const val GAME_FIELD__CREATOR_ID = "creatorUserId"

        /*******************************************************************************************
         * End string definitions for field names in Firebase documents.
         ******************************************************************************************/


        /*******************************************************************************************
         * Begin path definitions to documents. Alphabetize.
         ******************************************************************************************/

        /**
         * DocRef that navigates to Game documents.
         */
        val GAMES_COLLECTION =
            FirebaseProvider.getFirebaseFirestore().collection(GAME_COLLECTION_PATH)

        /*******************************************************************************************
         * End path definitions to documents
         ******************************************************************************************/
    }
}