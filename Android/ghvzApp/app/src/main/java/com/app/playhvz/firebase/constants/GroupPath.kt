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
import com.google.firebase.firestore.FieldPath

class GroupPath {
    companion object {
        /**
         * Top level collection name for Chat.
         */
        const val GROUP_COLLECTION_PATH = "groups"

        /*******************************************************************************************
         * Begin string definitions for field names in Firebase documents. Alphabetize.
         ******************************************************************************************/

        const val GROUP_FIELD__NAME = "name"
        const val GROUP_FIELD__MANAGED = "managed"
        const val GROUP_FIELD__OWNERS = "owners"
        const val GROUP_FIELD__SETTINGS = "settings"
        const val GROUP_FIELD__MEMBERS = "members"
        const val GROUP_FIELD__SETTINGS_ADD_SELF = "canAddSelf"
        const val GROUP_FIELD__SETTINGS_ADD_OTHERS = "canAddOthers"
        const val GROUP_FIELD__SETTINGS_REMOVE_SELF = "canRemoveSelf"
        const val GROUP_FIELD__SETTINGS_REMOVE_OTHERS = "canRemoveOthers"
        const val GROUP_FIELD__SETTINGS_AUTO_ADD = "autoAdd"
        const val GROUP_FIELD__SETTINGS_AUTO_REMOVE = "autoRemove"
        const val GROUP_FIELD__SETTINGS_ALLEGIANCE_FILTER = "allegianceFilter"

        /*******************************************************************************************
         * End string definitions for field names in Firebase documents.
         ******************************************************************************************/


        /*******************************************************************************************
         * Begin path definitions to documents. Alphabetize.
         ******************************************************************************************/

        /**
         * DocRef that navigates to Chat documents.
         */
        val GROUP_COLLECTION = { gameId: String ->
            GamePath.GAMES_COLLECTION.document(gameId).collection(GROUP_COLLECTION_PATH)
        }

        val GROUP_QUERY =
            FirebaseProvider.getFirebaseFirestore().collectionGroup(GROUP_COLLECTION_PATH)

        val GROUP_MISSION_MEMBERSHIP_QUERY =
            { gameId: String, playerId: String, groupIdsAssociatedWithMissions: List<String> ->
                GamePath.GAMES_COLLECTION.document(gameId).collection(GROUP_COLLECTION_PATH)
                    .whereIn(FieldPath.documentId(), groupIdsAssociatedWithMissions)
                    .whereArrayContains(GROUP_FIELD__MEMBERS, playerId)
            }

        val GROUP_DOCUMENT_REFERENCE = { gameId: String, groupId: String ->
            GROUP_COLLECTION(gameId).document(groupId)
        }

        /*******************************************************************************************
         * End path definitions to documents
         ******************************************************************************************/
    }
}