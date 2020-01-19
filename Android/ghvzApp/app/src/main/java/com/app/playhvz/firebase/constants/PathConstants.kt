package com.app.playhvz.firebase.constants

import androidx.annotation.VisibleForTesting
import com.app.playhvz.app.debug.DebugFlags.Companion.isTestingEnvironment
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.google.firebase.firestore.CollectionReference
import com.google.firebase.firestore.DocumentReference

class PathConstants {
    companion object {
        /*******************************************************************************************
         * String definitions for collection names. Alphabetize.
         ******************************************************************************************/

        /**
         * Top level collection name for Global Data.
         */
        @VisibleForTesting
        val GLOBAL_DATA_COLLECTION_PATH = "globalData"

        /**
         * Top level collection name for Users.
         */
        @VisibleForTesting
        val USER_COLLECTION_PATH = "users"

        /*******************************************************************************************
         * Begin string definitions for field names in Firebase documents. Alphabetize.
         ******************************************************************************************/

        /**
         * Field inside global version code document that contains the minimum supported android app
         * version.
         */
        val GLOBAL_DATA_FIELD__ANDROID_APP_VERSION_CODE = "androidMinAppVersion"

        /**
         * Field inside any document that contains the id of the user that owns that document.
         */
        val GLOBAL_DATA_FIELD__VERSION_CODE = "versionCodes"

        /**
         * Field inside any document that contains the id of the user that owns that document.
         */
        val UNIVERSAL_FIELD__USER_ID = "userId"

        /**
         * Field inside User document that contains the latest registered device token for
         * notifications.
         */
        val USER_FIELD__USER_DEVICE_TOKEN = "deviceToken"


        /*******************************************************************************************
         * End string definitions for field names in Firebase documents.
         ******************************************************************************************/


        /*******************************************************************************************
         * Begin path definitions to documents. Alphabetize.
         ******************************************************************************************/

        /**
         * DocRef that navigates to User's document.
         */
        fun USERS_COLLECTION(): CollectionReference {
            if (cachedUserCollection == null || isTestingEnvironment) {
                cachedUserCollection =
                    FirebaseProvider.getFirebaseFirestore().collection(USER_COLLECTION_PATH)
            }
            return cachedUserCollection!!
        }

        private var cachedUserCollection: CollectionReference? = null

        /**
         * DocRef that navigates to global version code information for force app upgrades.
         */
        fun VERSION_CODE_DOCREF(): DocumentReference {
            if (cachedVersionCodeDocref == null || isTestingEnvironment) {
                cachedVersionCodeDocref =
                    FirebaseProvider.getFirebaseFirestore().collection(GLOBAL_DATA_COLLECTION_PATH)
                        .document(GLOBAL_DATA_FIELD__VERSION_CODE)
            }
            return cachedVersionCodeDocref!!
        }

        private var cachedVersionCodeDocref: DocumentReference? = null
    }
    /*******************************************************************************************
     * End path definitions to documents
     ******************************************************************************************/
}