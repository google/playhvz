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

package com.app.playhvz.firebase.utils

import android.util.Log
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.google.android.gms.tasks.OnSuccessListener
import com.google.firebase.firestore.*
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

class FirebaseDatabaseUtil {
    companion object {
        private val TAG = FirebaseDatabaseUtil::class.qualifiedName

        fun initFirebaseDatabase() {
            val firestore = FirebaseProvider.getFirebaseFirestore()
            // Persist data to disk so that we have offline support.
            val settings = FirebaseFirestoreSettings.Builder()
                .setPersistenceEnabled(true)
                .build()
            firestore.firestoreSettings = settings
        }

        fun optimizedGet(
            docRef: DocumentReference?,
            successListener: OnSuccessListener<DocumentSnapshot>
        ) {
            docRef?.get(Source.CACHE)?.addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    Log.i(TAG, "Got data from local cache")
                    successListener.onSuccess(task.result)
                } else {
                    Log.i(TAG, "Failed to get user data from cache, trying server")
                    docRef.get(Source.SERVER).addOnSuccessListener(successListener)
                }
            }
        }

        fun optimizedGet(
            queryRef: Query?,
            successListener: OnSuccessListener<QuerySnapshot>
        ) {
            queryRef?.get(Source.CACHE)?.addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    Log.i(TAG, "Got data from local cache.")
                    successListener.onSuccess(task.result)
                } else {
                    Log.i(TAG, "Failed to get data from cache, trying server.")
                    queryRef.get(Source.SERVER).addOnSuccessListener { snapshot ->
                        successListener.onSuccess(snapshot)
                    }
                }
            }
        }

        suspend fun asyncGet(
            docRef: DocumentReference?,
            successListener: OnSuccessListener<DocumentSnapshot>
        ) {
            suspendCoroutine<DocumentSnapshot?> { continuation ->
                docRef?.get(Source.CACHE)?.addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        Log.i(TAG, "Got data from local cache.")
                        successListener.onSuccess(task.result)
                        continuation.resume(task.result)
                    } else {
                        Log.i(TAG, "Failed to get data from cache, trying server.")
                        docRef.get(Source.SERVER).addOnSuccessListener { snapshot ->
                            successListener.onSuccess(snapshot)
                            continuation.resume(snapshot)
                        }
                    }
                }
            }
        }

        suspend fun asyncGet(
            queryRef: Query?,
            successListener: OnSuccessListener<QuerySnapshot>
        ) {
            suspendCoroutine<QuerySnapshot?> { continuation ->
                queryRef?.get(Source.CACHE)?.addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        Log.i(TAG, "Got data from local cache.")
                        successListener.onSuccess(task.result)
                        continuation.resume(task.result)
                    } else {
                        Log.i(TAG, "Failed to get data from cache, trying server.")
                        queryRef.get(Source.SERVER).addOnSuccessListener { snapshot ->
                            successListener.onSuccess(snapshot)
                            continuation.resume(snapshot)
                        }
                    }
                }
            }
        }
    }
}

