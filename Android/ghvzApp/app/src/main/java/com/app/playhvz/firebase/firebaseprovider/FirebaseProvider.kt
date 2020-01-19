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