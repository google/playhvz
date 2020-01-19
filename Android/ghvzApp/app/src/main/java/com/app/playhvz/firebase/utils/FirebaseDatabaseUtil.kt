package com.app.playhvz.firebase.utils

import android.util.Log
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.google.android.gms.tasks.OnSuccessListener
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestoreSettings
import com.google.firebase.firestore.Source
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
    }
}

