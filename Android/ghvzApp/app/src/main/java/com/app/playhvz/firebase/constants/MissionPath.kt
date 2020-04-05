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

class MissionPath {
    companion object {
        /**
         * Top level collection name for Missions.
         */
        const val MISSION_COLLECTION_PATH = "missions"

        /*******************************************************************************************
         * Begin string definitions for field names in Firebase documents. Alphabetize.
         ******************************************************************************************/
        /**
         * Field inside Mission document that contains the mission details.
         */
        const val MISSION_FIELD__DETAILS = "details"

        /**
         * Field inside Mission document that contains the mission ending time.
         */
        const val MISSION_FIELD__END_TIME = "endTime"

        /**
         * Field inside Mission document that contains the group id associated with the mission.
         */
        const val MISSION_FIELD__GROUP_ID = "associatedGroupId"

        /**
         * Field inside Mission document that contains the mission name.
         */
        const val MISSION_FIELD__NAME = "name"

        /**
         * Field inside Mission document that contains the mission starting time.
         */
        const val MISSION_FIELD__START_TIME = "startTime"

        /*******************************************************************************************
         * End string definitions for field names in Firebase documents.
         ******************************************************************************************/


        /*******************************************************************************************
         * Begin path definitions to documents. Alphabetize.
         ******************************************************************************************/

        /**
         * DocRef that navigates to Mission documents.
         */
        val MISSION_COLLECTION = { gameId: String ->
            GamePath.GAMES_COLLECTION.document(gameId).collection(MISSION_COLLECTION_PATH)
        }

        val MISSION_DOCUMENT_REFERENCE = { gameId: String, missionId: String ->
            MISSION_COLLECTION(gameId).document(missionId)
        }

        val MISSION_BY_GROUP_QUERY = { gameId: String, groupIdList: List<String> ->
            GamePath.GAMES_COLLECTION.document(gameId).collection(MISSION_COLLECTION_PATH)
                .whereIn(MISSION_FIELD__GROUP_ID, groupIdList)
                .orderBy(MISSION_FIELD__END_TIME, Query.Direction.DESCENDING)
        }

        val LATEST_MISSION_QUERY = { gameId: String, groupIdList: List<String> ->
            GamePath.GAMES_COLLECTION.document(gameId).collection(MISSION_COLLECTION_PATH)
                .whereIn(MISSION_FIELD__GROUP_ID, groupIdList)
                .orderBy(MISSION_FIELD__END_TIME, Query.Direction.DESCENDING)
                .limit(1)
        }

        /*******************************************************************************************
         * End path definitions to documents
         ******************************************************************************************/
    }
}