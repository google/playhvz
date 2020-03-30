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

import android.content.SharedPreferences
import android.util.Log
import com.app.playhvz.app.debug.DebugFlags
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.constants.GamePath.Companion.GAMES_COLLECTION
import com.app.playhvz.firebase.constants.GamePath.Companion.GAME_FIELD__CREATOR_ID
import com.app.playhvz.firebase.constants.PlayerPath
import com.app.playhvz.firebase.constants.UniversalConstants.Companion.UNIVERSAL_FIELD__USER_ID
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.firebase.utils.FirebaseDatabaseUtil
import com.google.android.gms.tasks.OnSuccessListener
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.QuerySnapshot
import kotlinx.coroutines.Dispatchers
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
            val data = hashMapOf(
                "name" to name
            )

            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("checkGameExists")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Game $name isn't valid for the user to join.")
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

        /** Check if game exists and tries to add player to game if so. */
        suspend fun asyncTryToJoinGame(
            gameName: String,
            playerName: String,
            successListener: (gameId: String) -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameName" to gameName,
                "playerName" to playerName
            )

            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("joinGame")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        failureListener.invoke()
                        return@continueWith
                    }
                    // gameId is returned.
                    val result = task.result?.data as String
                    successListener.invoke(result)
                }
        }

        /** Calls the firebase endpoint for creating a game or handling errors if the game exists. */
        suspend fun asyncTryToCreateGame(
            name: String,
            successListener: OnSuccessListener<String>,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "name" to name
            )

            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("createGame")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Failed to create game $name " + task.exception)
                        failureListener.invoke()
                        return@continueWith
                    }
                    val result = task.result?.data as String
                    successListener.onSuccess(result)
                }
        }

        /** Check if game name already exists. */
        suspend fun asyncDeleteGame(gameId: String, successListener: () -> Unit) =
            withContext(Dispatchers.Default) {
                if (!DebugFlags.isDevEnvironment && !DebugFlags.isTestingEnvironment) {
                    // Only allow deleting from the dev & test environments
                    return@withContext
                }
                val data = hashMapOf(
                    "gameId" to gameId
                )
                FirebaseProvider.getFirebaseFunctions()
                    .getHttpsCallable("deleteGame")
                    .call(data)
                    .continueWith { task ->
                        if (!task.isSuccessful) {
                            Log.e(TAG, "Failed to delete game, " + task.exception)
                            return@continueWith
                        }
                        successListener.invoke()
                    }
            }

        /** Returns a Query listing all Games created by the current user. */
        fun getGameByCreatorQuery(): Query {
            return GAMES_COLLECTION.whereEqualTo(
                GAME_FIELD__CREATOR_ID,
                FirebaseProvider.getFirebaseAuth().uid
            )
        }

        /** Returns a Query listing all Games in which the current user is a player. */
        fun getGameByPlayerQuery(): Query {
            return PlayerPath.PLAYERS_QUERY.whereEqualTo(
                UNIVERSAL_FIELD__USER_ID,
                FirebaseProvider.getFirebaseAuth().uid
            )
        }

        /** Returns the user's playerId for the given Games. */
        suspend fun getPlayerIdForGame(
            gameId: String,
            editor: SharedPreferences.Editor,
            successListener: () -> Unit
        ) =
            withContext(Dispatchers.Default) {
                val playerQuery = PlayerPath.PLAYERS_COLLECTION(gameId).whereEqualTo(
                    UNIVERSAL_FIELD__USER_ID,
                    FirebaseProvider.getFirebaseAuth().uid
                )
                val onSuccess: OnSuccessListener<QuerySnapshot> =
                    OnSuccessListener { querySnapshot ->
                        updatePlayerIdPref(querySnapshot, editor)
                        successListener.invoke()
                    }
                FirebaseDatabaseUtil.optimizedGet(playerQuery, onSuccess)
            }

        private fun updatePlayerIdPref(
            querySnapshot: QuerySnapshot?,
            editor: SharedPreferences.Editor
        ) {
            var playerId: String? = null
            if (querySnapshot != null && !querySnapshot.isEmpty && querySnapshot.documents.size == 1) {
                playerId = querySnapshot.documents[0].id
            }
            editor.putString(SharedPreferencesConstants.CURRENT_PLAYER_ID, playerId)
            editor.apply()
        }
    }
}