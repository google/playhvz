package com.app.playhvz.firebase.operations

import android.util.Log
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.constants.PathConstants
import com.app.playhvz.firebase.constants.PlayerPath
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.firebase.utils.FirebaseDatabaseUtil
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.Query
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.w3c.dom.Document

class PlayerDatabaseOperations {
    companion object {
        private val TAG = PlayerDatabaseOperations::class.qualifiedName

        /** Check if game exists and tries to add player to game if so. */
        suspend fun asyncCheckUserNotPlayerOfGame(
            gameId: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val playerQuery = getUsersPlayersQuery(gameId)
            playerQuery?.get()?.addOnSuccessListener { documents ->
                if (!documents.isEmpty) {
                    failureListener.invoke()
                } else {
                    successListener.invoke()
                }
            }
        }

        /** Check if user already has a player for game and create one if needed. */
        fun joinGame(gameId: String, playerName: String, successListener: () -> Unit) {
            getUsersPlayersQuery(gameId)?.get()?.addOnSuccessListener { documents ->
                if (documents.isEmpty) {
                    addPlayerToGame(gameId, playerName, successListener)
                }
            }
        }

        /** Joins an existing game. */
        private fun addPlayerToGame(gameId: String, playerName: String, successListener: () -> Unit) {
            val player = Player()
            val userId = FirebaseProvider.getFirebaseAuth().uid ?: return
            player.userId = userId
            PlayerPath.PLAYERS_COLLECTION(gameId).add(player)
                .addOnSuccessListener { document ->
                    val publicData = Player()
                    publicData.name = playerName
                    PlayerPath.PUBLIC_COLLECTION(document).add(publicData)
                    PlayerPath.PRIVATE_COLLECTION(document).add(Player.Private())
                    successListener.invoke()
                }
        }

        /** Returns a Query listing all players in the given game that are owned by this user. */
        private fun getUsersPlayersQuery(gameId: String): Query? {
            val userId = FirebaseProvider.getFirebaseAuth().uid ?: return null
            return PlayerPath.PLAYERS_COLLECTION(gameId)
                .whereEqualTo(PathConstants.UNIVERSAL_FIELD__USER_ID, userId)
        }

        /** Returns a Query listing all players in the given game that have the given player name. */
        private fun getPlayersByNameQuery(gameId: String /*, playerName: String*/): Query? {
            PlayerPath.PLAYERS_COLLECTION(gameId).get().continueWith { task ->
                if (task.exception != null) {
                    Log.d(TAG, "Failed to get players.", task.exception)
                }
                if (task.isSuccessful && task.result != null){
                    val snapshot = task.result
                    if (snapshot != null) {
                        for (doc in snapshot) {
                            /* NOTE TO SELF
                            maybe put all the public stuff into the top level player data so we don't
                            have to do a second query to get the public collection
                            question: any concern with userid being in the top level doc too?
                             */
                        }
                    }
                }
            }

            return PlayerPath.PLAYERS_COLLECTION(gameId)
        }
    }
}