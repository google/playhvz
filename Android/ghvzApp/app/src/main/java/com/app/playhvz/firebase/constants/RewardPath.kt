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

class RewardPath {
    companion object {
        /**
         * Top level collection name for Rewards.
         */
        const val REWARD_COLLECTION_PATH = "rewards"

        /*******************************************************************************************
         * Begin string definitions for field names in Firebase documents. Alphabetize.
         ******************************************************************************************/
        /**
         * Field inside Reward document that contains the short name of the reward.
         */
        const val REWARD_FIELD__SHORT_NAME = "shortName"


        /*******************************************************************************************
         * End string definitions for field names in Firebase documents.
         ******************************************************************************************/


        /*******************************************************************************************
         * Begin path definitions to documents. Alphabetize.
         ******************************************************************************************/

        /**
         * DocRef that navigates to Reward documents.
         */
        val REWARD_COLLECTION = { gameId: String ->
            GamePath.GAMES_COLLECTION.document(gameId).collection(REWARD_COLLECTION_PATH)
        }

        val REWARD_DOCUMENT_REFERENCE = { gameId: String, rewardId: String ->
            REWARD_COLLECTION(gameId).document(rewardId)
        }

        /*******************************************************************************************
         * End path definitions to documents
         ******************************************************************************************/
    }
}