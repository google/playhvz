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

package com.app.playhvz.testutils.firebase

import com.app.playhvz.firebase.constants.GamePath
import com.app.playhvz.firebase.constants.PathConstants
import com.app.playhvz.firebase.constants.PlayerPath
import com.google.firebase.firestore.CollectionReference
import com.google.firebase.firestore.FirebaseFirestore
import io.mockk.every

class MockDatabaseManager(val mockFirebaseFirestore: FirebaseFirestore) {
    private companion object {
        const val DEFINITELY_SUPPORTED_APP_VERSION = -10L
    }

    var collectionMap: HashMap<String, CollectionReference>? = null

    fun getMockFirestore(): FirebaseFirestore {
        return mockFirebaseFirestore
    }

    fun initilizeCollectionMocks() {
        if (collectionMap.isNullOrEmpty()) {
            initializeTopLevelCollectionMocks()
        }
        initializeCollectionGroupMocks()
    }

    fun initializePassingVersionCodeCheck() {
        val versionCodeDocument = FirebaseTestUtil.mockDocument()
        val mockSnapshot = FirebaseTestUtil.mockSnapshot()

        if (collectionMap.isNullOrEmpty()) {
            initializeTopLevelCollectionMocks()
        }

        FirebaseTestUtil.whenGetDocumentThenReturn(
            collectionMap!![PathConstants.GLOBAL_DATA_COLLECTION_PATH]!!,
            PathConstants.GLOBAL_DATA_FIELD__VERSION_CODE,
            versionCodeDocument
        )
        FirebaseTestUtil.onAddSnapshotListener(versionCodeDocument, mockSnapshot)

        every { mockSnapshot.exists() } returns true
        every { mockSnapshot.getLong(PathConstants.GLOBAL_DATA_FIELD__ANDROID_APP_VERSION_CODE) } returns DEFINITELY_SUPPORTED_APP_VERSION
    }

    private fun initializeTopLevelCollectionMocks() {
        collectionMap = FirebaseTestUtil.initializeCollectionMap(
            listOf(
                PathConstants.USER_COLLECTION_PATH,
                PathConstants.GLOBAL_DATA_COLLECTION_PATH,
                GamePath.GAME_COLLECTION_PATH,
                PlayerPath.PLAYER_COLLECTION_PATH
            )
        )

        FirebaseTestUtil.whenGetCollectionThenReturn(
            mockFirebaseFirestore,
            collectionMap!!
        )
    }

    private fun initializeCollectionGroupMocks() {
        FirebaseTestUtil.whenGetCollectionGroupThenReturn(mockFirebaseFirestore, collectionMap!!)
    }
}