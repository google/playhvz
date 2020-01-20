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

import com.google.android.gms.tasks.OnSuccessListener
import com.google.android.gms.tasks.Task
import com.google.firebase.firestore.*
import io.mockk.every
import io.mockk.mockkClass

class FirebaseTestUtil {
    companion object {
        private val TAG = FirebaseTestUtil::class.qualifiedName

        /***********************************************************************************************
         * Mock Primitive Firebase Types
         **********************************************************************************************/
        fun mockCollection(): CollectionReference {
            return mockkClass(CollectionReference::class)
        }

        fun mockDocument(): DocumentReference {
            return mockkClass(DocumentReference::class)
        }

        fun mockSnapshot(): DocumentSnapshot {
            return mockkClass(DocumentSnapshot::class)
        }


        /** Mocks a document access for a single document type. */
        fun whenGetDocumentThenReturn(
            collection: CollectionReference,
            documentId: String,
            document: DocumentReference
        ) {
            every { collection.document(documentId) } returns document
        }

        /** Mocks a DocumentSnapshot once for a given document. */
        fun onAddSnapshotListener(document: DocumentReference, snapshot: DocumentSnapshot) {
            every {
                document.addSnapshotListener(any<EventListener<DocumentSnapshot>>())
            } answers {
                val callback = args[0] as EventListener<DocumentSnapshot>
                callback.onEvent(snapshot, null)
                // Needed because https://stackoverflow.com/a/49007245/12094056
                return@answers ListenerRegistration {}
            }
        }

        /** Mocks a QuerySnapshot once for a given document. */
        fun onAddQuerySnapshotListener(query: Query, snapshot: QuerySnapshot) {
            every {
                query.addSnapshotListener(any<EventListener<QuerySnapshot>>())
            } answers {
                val callback = args[0] as EventListener<QuerySnapshot>
                callback.onEvent(snapshot, null)
                // Needed because https://stackoverflow.com/a/49007245/12094056
                return@answers ListenerRegistration {}
            }
        }

        /** Mocks a DocumentSnapshot once for a given document. */
        fun <T> onTaskAddSnapshotListener(task: Task<T>, snapshot: T) {
            every {
                task.addOnSuccessListener(any<OnSuccessListener<T>>())
            } answers {
                val callback = args[0] as OnSuccessListener<T>
                callback.onSuccess(snapshot)
                // Needed because https://stackoverflow.com/a/49007245/12094056
                return@answers task
            }
        }

        fun initializeCollectionMap(collectionPaths: List<String>): HashMap<String, CollectionReference> {
            val collectionMap: HashMap<String, CollectionReference> = HashMap()
            for (path in collectionPaths) {
                collectionMap[path] = mockCollection()
            }
            return collectionMap
        }

        /** Mocks a collection returning from Firestore. */
        fun whenGetCollectionThenReturn(
            firestore: FirebaseFirestore,
            mapping: HashMap<String, CollectionReference>
        ) {
            every {
                firestore.collection(any<String>())
            } answers {
                val collectionPath = args[0] as String
                if (mapping.containsKey(collectionPath)) {
                    return@answers mapping[collectionPath]!!
                } else {
                    throw Exception("No mock collection set for path: " + collectionPath)
                }
            }
        }

        /** Mocks a collection returning from Firestore. */
        fun whenGetCollectionGroupThenReturn(
            firestore: FirebaseFirestore,
            mapping: HashMap<String, CollectionReference>
        ) {
            every {
                firestore.collectionGroup(any<String>())
            } answers {
                val collectionPath = args[0] as String
                if (mapping.containsKey(collectionPath)) {
                    return@answers mapping[collectionPath]!!
                } else {
                    throw Exception("No mock collection group set for path: " + collectionPath)
                }
            }
        }
    }
}