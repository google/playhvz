package com.app.playhvz.firebase.operations

import android.util.Log
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.constants.GamePath.Companion.GAMES_COLLECTION
import com.app.playhvz.firebase.constants.GamePath.Companion.GAME_FIELD__CREATOR_ID
import com.app.playhvz.firebase.constants.GamePath.Companion.GAME_FIELD__NAME
import com.app.playhvz.firebase.constants.PathConstants.Companion.UNIVERSAL_FIELD__USER_ID
import com.app.playhvz.firebase.constants.PlayerPath
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.firebase.operations.PlayerDatabaseOperations.Companion.joinGame
import com.google.android.gms.tasks.OnSuccessListener
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.Query
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext

class GameDatabaseOperations {
    companion object {
        private val TAG = GameDatabaseOperations::class.qualifiedName

        /** Check if game exists and tries to add player to game if so. */
        suspend fun asyncCheckGameExistsAndPlayerCanJoin(
            name: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val gameQuery = getGameByNameQuery(name)
            gameQuery?.get()?.addOnSuccessListener { snapshot ->
                if (snapshot.isEmpty || snapshot.size() > 1) {
                    failureListener.invoke()
                } else {
                    runBlocking {
                        PlayerDatabaseOperations.asyncCheckUserNotPlayerOfGame(
                            snapshot.documents[0].id,
                            successListener,
                            failureListener
                        )
                    }
                }
            }
        }

        /** Check if game exists and tries to add player to game if so. */
        suspend fun asyncTryToJoinGame(
            gameName: String,
            playerName: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val gameQuery = getGameByNameQuery(gameName)
            gameQuery?.get()?.addOnSuccessListener { documents ->
                if (documents.isEmpty || documents.size() > 1) {
                    failureListener.invoke()
                } else {
                    joinGame(documents.elementAt(0).id, playerName, successListener)
                }
            }
        }

        /** Check if game name already exists. */
        suspend fun asyncTryToCreateGame(
            name: String,
            successListener: OnSuccessListener<DocumentReference>,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val gameQuery = getGameByNameQuery(name)
            gameQuery?.get()?.addOnSuccessListener { documents ->
                if (!documents.isEmpty) {
                    failureListener.invoke()
                } else {
                    createNewGame(name, successListener)
                }
            }
        }

        /** Check if game name already exists. */
        suspend fun asyncDeleteGame(gameId: String, successListener: () -> Unit) =
            withContext(Dispatchers.Default) {
                GAMES_COLLECTION.document(gameId).delete().addOnSuccessListener {
                    successListener.invoke()
                }
            }

        /** Returns a Query listing all Games created by the current user. */
        fun getGameByCreatorQuery(): Query? {
            return GAMES_COLLECTION.whereEqualTo(
                GAME_FIELD__CREATOR_ID,
                FirebaseProvider.getFirebaseAuth().uid
            )
        }


        /** Returns a Query listing all Games in which the current user is a player. */
        fun getGameByPlayerQuery(): Query? {
            return PlayerPath.PLAYERS_QUERY.whereEqualTo(
                UNIVERSAL_FIELD__USER_ID,
                FirebaseProvider.getFirebaseAuth().uid
            )
        }

        /** Creates a new game. */
        private fun createNewGame(
            name: String,
            successListener: OnSuccessListener<DocumentReference>
        ) {
            val game = Game()
            game.name = name
            game.creatorUserId = FirebaseProvider.getFirebaseAuth().uid
            GAMES_COLLECTION.add(game)
                .addOnSuccessListener(successListener)
                .addOnFailureListener { e ->
                    Log.e(TAG, "Failed to create game $e")
                }
        }

        /** Returns a Query listing all Games with the given name. */
        private fun getGameByNameQuery(name: String): Query? {
            return if (name.isEmpty()) null else GAMES_COLLECTION.whereEqualTo(
                GAME_FIELD__NAME,
                name
            )
        }
    }
}