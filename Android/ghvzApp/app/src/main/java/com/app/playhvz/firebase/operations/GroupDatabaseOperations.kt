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

import com.app.playhvz.firebase.constants.GroupPath
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.google.firebase.firestore.DocumentReference
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class GroupDatabaseOperations {
    companion object {
        private val TAG = GroupDatabaseOperations::class.qualifiedName

        /** Returns a document reference to the given groupId. */
        fun getGroupDocumentReference(
            gameId: String,
            groupId: String
        ): DocumentReference {
            return GroupPath.GROUP_DOCUMENT_REFERENCE(gameId, groupId)
        }
    }
}