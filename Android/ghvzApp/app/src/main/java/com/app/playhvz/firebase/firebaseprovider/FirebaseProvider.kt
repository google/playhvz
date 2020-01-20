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

package com.app.playhvz.firebase.firebaseprovider

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

/**
 * This class is overridden in tests! If you change the directory path you must change the
 * test directory path too in order for Firebase to still be mocked for tests.
 */
class FirebaseProvider {
    companion object {
        private var firebaseAuth: FirebaseAuth? = null
        private var firebaseFirestore: FirebaseFirestore? = null

        /** Returns a valid firebaseAuth instance. */
        fun getFirebaseAuth(): FirebaseAuth {
            if (firebaseAuth == null) {
                firebaseAuth = FirebaseAuth.getInstance()
            }
            return firebaseAuth!!
        }

        /** Returns a valid firebaseFirestore instance. */
        fun getFirebaseFirestore(): FirebaseFirestore {
            if (firebaseFirestore == null) {
                firebaseFirestore = FirebaseFirestore.getInstance()
            }
            return firebaseFirestore!!
        }

    }
}