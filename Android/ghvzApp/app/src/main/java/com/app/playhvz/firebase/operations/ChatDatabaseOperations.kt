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

import android.util.Log
import com.app.playhvz.firebase.constants.ChatPath
import com.app.playhvz.firebase.constants.PlayerPath
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.google.firebase.firestore.CollectionReference
import com.google.firebase.firestore.DocumentReference
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ChatDatabaseOperations {
    companion object {
        private val TAG = ChatDatabaseOperations::class.qualifiedName

        /** Returns a document reference to the given chatRoomId. */
        fun getChatRoomDocumentReference(
            gameId: String,
            chatRoomId: String
        ): DocumentReference {
            return ChatPath.CHAT_DOCUMENT_REFERENCE(gameId, chatRoomId)
        }

        /** Returns a collection reference to the given chatRoomId. */
        fun getChatRoomMessagesReference(
            gameId: String,
            chatRoomId: String
        ): CollectionReference {
            return ChatPath.MESSAGE_COLLECTION(gameId, chatRoomId)
        }

        /** Check if game exists and tries to add player to game if so. */
        suspend fun sendChatMessage(
            gameId: String,
            chatRoomId: String,
            playerId: String,
            message: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "chatRoomId" to chatRoomId,
                "senderId" to playerId,
                "message" to message
            )

            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("sendChatMessage")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        Log.e(TAG, "Could not send message: ${task.exception}")
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

        /** Create Chat Room. */
        suspend fun asyncCreateChatRoom(
            gameId: String,
            playerId: String,
            chatName: String,
            allegianceFilter: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "ownerId" to playerId,
                "chatName" to chatName,
                "allegianceFilter" to allegianceFilter
            )

            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("createChatRoom")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

        /** Create Chat Room. */
        suspend fun asyncAddPlayersToChat(
            gameId: String,
            playerIdList: List<String>,
            groupId: String,
            chatRoomId: String,
            successListener: () -> Unit,
            failureListener: () -> Unit
        ) = withContext(Dispatchers.Default) {
            val data = hashMapOf(
                "gameId" to gameId,
                "groupId" to groupId,
                "chatRoomId" to chatRoomId,
                "playerIdList" to playerIdList
            )

            FirebaseProvider.getFirebaseFunctions()
                .getHttpsCallable("addPlayersToChat")
                .call(data)
                .continueWith { task ->
                    if (!task.isSuccessful) {
                        failureListener.invoke()
                        return@continueWith
                    }
                    successListener.invoke()
                }
        }

    }
}