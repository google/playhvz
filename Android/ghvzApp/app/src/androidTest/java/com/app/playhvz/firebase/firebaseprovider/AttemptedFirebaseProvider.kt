package com.app.playhvz.firebase.firebaseprovider

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import io.mockk.mockkClass

class AttemptedFirebaseProvider {
    companion object {
        private var firebaseAuth: FirebaseAuth? = null
        private var firebaseFirestore: FirebaseFirestore? = null

        /** Returns a valid firebaseAuth instance. */
        fun getFirebaseAuth(): FirebaseAuth {
            if (firebaseAuth == null) {
                println("lizard - mocking firebase auth")
                firebaseAuth = mockkClass(FirebaseAuth::class)
            }
            println("lizard - reusing firebase auth")
            return firebaseAuth!!
        }

        /** Returns a valid firebaseFirestore instance. */
        fun getFirebaseFirestore(): FirebaseFirestore {
            if (firebaseFirestore == null) {
                println("lizard - mocking firebase firestore")
                firebaseFirestore = mockkClass(FirebaseFirestore::class)
            }
            println("lizard - reusing firebase firestore")
            return firebaseFirestore!!
        }

    }
}