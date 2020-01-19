package com.app.playhvz.firebase.constants

import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.google.firebase.firestore.DocumentReference

class PlayerPath {
    companion object {
        /*******************************************************************************************
         * String definitions for collection names. Alphabetize.
         ******************************************************************************************/

        /**
         * Top level collection name for Players.
         */
        const val PLAYER_COLLECTION_PATH = "players"

        /*******************************************************************************************
         * Begin string definitions for field names in Firebase documents. Alphabetize.
         ******************************************************************************************/

        /**
         * Field inside Player's Public document that contains the name of the player.
         */
        const val PLAYER_FIELD__NAME = "name"


        /*******************************************************************************************
         * End string definitions for field names in Firebase documents.
         ******************************************************************************************/

        /*******************************************************************************************
         * Begin path definitions to documents. Alphabetize.
         ******************************************************************************************/

        /**
         * DocRef that navigates to a Game's Player collection documents.
         */
        val PLAYERS_COLLECTION = { gameId: String ->
            GamePath.GAMES_COLLECTION.document(gameId).collection(PLAYER_COLLECTION_PATH)
        }

        val PLAYERS_QUERY =
            FirebaseProvider.getFirebaseFirestore().collectionGroup(PLAYER_COLLECTION_PATH)

        /**
         * DocRef that navigates to a Player's Public collection document.
         */
        val PLAYERS_PUBLIC_COLLECTION = { gameId: String, playerDocRefId: String ->
            PLAYERS_COLLECTION(gameId).document(playerDocRefId).collection("public")
        }

        /**
         * DocRef that navigates to a Player's Public collection document.
         */
        val PLAYERS_PRIVATE_COLLECTION = { gameId: String, playerDocRefId: String ->
            PLAYERS_COLLECTION(gameId).document(playerDocRefId).collection("private")
        }

        /**
         * DocRef that navigates to a given Player's Public collection document.
         */
        val PUBLIC_COLLECTION = { playerDocument: DocumentReference ->
            playerDocument.collection("public")
        }

        /**
         * DocRef that navigates to a given Player's Private collection document.
         */
        val PRIVATE_COLLECTION = { playerDocument: DocumentReference ->
            playerDocument.collection("private")
        }

        /*******************************************************************************************
         * End path definitions to documents
         ******************************************************************************************/
    }
}