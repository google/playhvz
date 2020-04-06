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

package com.app.playhvz.firebase.viewmodels

import android.util.Log
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LiveData
import androidx.lifecycle.ViewModel
import com.app.playhvz.app.HvzData
import com.app.playhvz.firebase.classmodels.ChatRoom
import com.app.playhvz.firebase.classmodels.ChatRoom.Companion.FIELD__IS_VISIBLE
import com.app.playhvz.firebase.operations.ChatDatabaseOperations.Companion.getChatRoomDocumentReference
import com.app.playhvz.firebase.operations.PlayerDatabaseOperations.Companion.getPlayerDocumentReference
import com.app.playhvz.firebase.utils.DataConverterUtil
import com.app.playhvz.utils.ObserverUtils
import com.google.android.gms.tasks.Tasks
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.EventListener

class ChatListViewModel : ViewModel() {
    companion object {
        private val TAG = ChatListViewModel::class.qualifiedName
    }

    private var chatRoomIdList: HvzData<List<String>> = HvzData(listOf())
    private var chatRoomList: HvzData<Map<String, ChatRoom?>> = HvzData(mapOf())

    /** Listens to a player's chat room membership updates and returns a LiveData object listing
     * the chat rooms the player is currently in. */
    fun getChatRoomList(
        lifecycleOwner: LifecycleOwner,
        gameId: String,
        playerId: String
    ): LiveData<Map<String, ChatRoom?>> {
        if (chatRoomIdList.hasObservers()) {
            // We've already started observing
            return chatRoomList
        }
        chatRoomIdList.observe(
            lifecycleOwner,
            androidx.lifecycle.Observer { updatedChatRoomIdList ->
                observeChatRooms(gameId, updatedChatRoomIdList)
            })
        listenToPlayerChatRoomIds(gameId, playerId)
        return chatRoomList
    }

    /** Registers an event listener that watches for chat membership changes on the player object. */
    private fun listenToPlayerChatRoomIds(gameId: String, playerId: String) {
        val chatRoomIdListener = getPlayerDocumentReference(gameId, playerId).addSnapshotListener(
            EventListener { snapshot, e ->
                if (e != null) {
                    Log.w(TAG, "Listen to chat memberships failed. ", e)
                    chatRoomIdList.value = emptyList()
                    return@EventListener
                }
                val player = DataConverterUtil.convertSnapshotToPlayer(snapshot!!)
                val updatedChatRoomIds: MutableList<String> = mutableListOf()
                for ((key, value) in player.chatRoomMemberships) {
                    if (value.getOrElse(FIELD__IS_VISIBLE) { false }) {
                        updatedChatRoomIds.add(key)
                    }
                }
                if (chatRoomList.value != null) {
                    // Remove chat room listeners for rooms the user isn't a member of anymore.
                    val removedRooms =
                        chatRoomIdList.value!!.toSet().minus(updatedChatRoomIds.toSet())
                    stopListening(removedRooms)
                }
                chatRoomIdList.value = updatedChatRoomIds
            }
        )
        chatRoomIdList.docIdListeners[playerId] = chatRoomIdListener
    }

    /** Listens to updates on every chat room the player is a member of. */
    private fun observeChatRooms(
        gameId: String,
        updatedChatRoomIdList: List<String>
    ): LiveData<Map<String, ChatRoom?>> {
        for (chatRoomId in updatedChatRoomIdList) {
            if (chatRoomId in chatRoomList.docIdListeners) {
                // We're already listening to this room
                continue
            }
            chatRoomList.docIdListeners[chatRoomId] =
                getChatRoomDocumentReference(gameId, chatRoomId).addSnapshotListener(
                    EventListener<DocumentSnapshot> { snapshot, e ->
                        if (e != null) {
                            Log.w(TAG, "ChatRoom listen failed. ", e)
                            return@EventListener
                        }
                        if (snapshot == null || !snapshot.exists()) {
                            val updatedRoomList = chatRoomList.value!!.toMutableMap()
                            updatedRoomList.remove(chatRoomId)
                            chatRoomList.value = updatedRoomList
                            stopListening(setOf(chatRoomId))
                            return@EventListener
                        }
                        val updatedChatRoom = DataConverterUtil.convertSnapshotToChatRoom(snapshot)
                        val updatedRoomList = chatRoomList.value!!.toMutableMap()
                        updatedRoomList[chatRoomId] = updatedChatRoom
                        chatRoomList.value = updatedRoomList
                    })
        }
        return chatRoomList
    }

    private fun stopListening(removedIds: Set<String>) {
        for (removedId in removedIds) {
            if (!chatRoomList.docIdListeners.containsKey(removedId)) {
                continue
            }
            chatRoomList.docIdListeners[removedId]?.remove()
            chatRoomList.docIdListeners.remove(removedId)
        }
    }

    /** Reloads all chat rooms and waits for every one to be done. */
    private fun refreshAllChatRooms(gameId: String) {
        val tasks = chatRoomIdList.value!!.map { chatRoomId ->
            getChatRoomDocumentReference(gameId, chatRoomId).get()
        }
        Tasks.whenAll(tasks).addOnCompleteListener { _ ->
            //val updatedList: MutableList<ChatRoom> = mutableListOf()
            for (task in tasks) {
                if (task.isSuccessful) {
                    val snapshot = task.result
                    if (snapshot != null && snapshot.exists()) {
                        //updatedList.add(DataConverterUtil.convertSnapshotToChatRoom(snapshot))
                    }
                } else {
                    Log.d(TAG, "Failed to get ChatRoom, ${task.exception}")
                }
            }
            //chatRoomList.value = updatedList
        }
    }
}