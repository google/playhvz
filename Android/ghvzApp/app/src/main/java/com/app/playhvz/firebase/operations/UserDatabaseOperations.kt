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

import android.util.Log
import com.app.playhvz.firebase.classmodels.User
import com.app.playhvz.firebase.constants.PathConstants
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.Source
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class UserDatabaseOperations() {
    companion object {
        private val TAG = UserDatabaseOperations::class.qualifiedName

        /** Async call to Firebase to check if the user exists or not. Creates the user if they
         * don't exist, so when this function returns we are guaranteed that the user exists. */
        suspend fun asyncEnsureUserInDatabase(
            successListener: () -> Unit
        ) =
            withContext(Dispatchers.Default) {
                val currentUserDocRef = getCurrentUserDocRef()
                val createUserAndExitWithSuccess = { document: DocumentSnapshot? ->
                    if (document != null && !document.exists()) {
                        // This user isn't in Firebase yet, add them
                        Log.d(TAG, "Adding new user to firestore")
                        val user = User()
                        currentUserDocRef?.set(user)
                    }
                    successListener.invoke()
                }

                // By default Firestore get() always gets the latest data from the server. To speed up
                // initial app load and have offline support, we need to check the cache first and only
                // check the server if the cache fails.
                currentUserDocRef?.get(Source.CACHE)?.addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        Log.d(TAG, "User data fetched from local cache")
                        createUserAndExitWithSuccess.invoke(task.result)
                    } else {
                        Log.d(TAG, "Failed to get user data from cache, trying server")
                        currentUserDocRef.get().addOnSuccessListener(createUserAndExitWithSuccess)
                    }
                }
            }

        /** Registers this device to the current account for notifications. */
        fun registerDeviceToCurrentUser(token: String?) {
            Log.d(TAG, "Registering device to current user")
            getCurrentUserDocRef()?.update(PathConstants.USER_FIELD__USER_DEVICE_TOKEN, token)
        }

        /** Registers this device from the current account for notifications. */
        fun unregisterDeviceFromCurrentUser() {
            getCurrentUserDocRef()?.update(PathConstants.USER_FIELD__USER_DEVICE_TOKEN, null)
        }

        /** Returns a DocRef to the current user's User document. */
        fun getCurrentUserDocRef(): DocumentReference? {
            val currentUserId = FirebaseProvider.getFirebaseAuth().uid
            return if (currentUserId != null) PathConstants.USERS_COLLECTION().document(
                currentUserId
            ) else null
        }
    }
}