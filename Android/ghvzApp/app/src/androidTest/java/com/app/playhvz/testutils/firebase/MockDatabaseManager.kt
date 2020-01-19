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