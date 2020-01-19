package com.app.playhvz.firebase.constants

import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider

class GamePath {
    companion object {
        /*******************************************************************************************
         * String definitions for collection names. Alphabetize.
         ******************************************************************************************/

        /**
         * Top level collection name for Players.
         */
        const val GAME_COLLECTION_PATH = "games"

        /*******************************************************************************************
         * Begin string definitions for field names in Firebase documents. Alphabetize.
         ******************************************************************************************/

        /**
         * Field inside Game document that contains the name of the game.
         */
        const val GAME_FIELD__NAME = "name"

        /**
         * Field inside Game document that contains the uid of the user who created the game.
         */
        const val GAME_FIELD__CREATOR_ID = "creatorUserId"

        /*******************************************************************************************
         * End string definitions for field names in Firebase documents.
         ******************************************************************************************/


        /*******************************************************************************************
         * Begin path definitions to documents. Alphabetize.
         ******************************************************************************************/

        /**
         * DocRef that navigates to Game documents.
         */
        val GAMES_COLLECTION =
            FirebaseProvider.getFirebaseFirestore().collection(GAME_COLLECTION_PATH)

        /*******************************************************************************************
         * End path definitions to documents
         ******************************************************************************************/
    }
}