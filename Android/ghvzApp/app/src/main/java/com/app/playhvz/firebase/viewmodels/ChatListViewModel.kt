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
import com.google.android.gms.tasks.Tasks
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.EventListener
import com.google.firebase.firestore.ListenerRegistration

class ChatListViewModel : ViewModel() {
    companion object {
        private val TAG = ChatListViewModel::class.qualifiedName
    }

    private var chatRoomIdList: HvzData<List<String>> = HvzData()
    private var chatRoomList: HvzData<List<ChatRoom>> = HvzData()

    /** Listens to a player's chat room membership updates and returns a LiveData object listing
     * the ids of the chat rooms the player is currently in. */
    fun getChatRoomList(
        lifecycleOwner: LifecycleOwner,
        gameId: String,
        playerId: String
    ): LiveData<List<ChatRoom>> {
        val listener = getPlayerDocumentReference(gameId, playerId).addSnapshotListener(
            listenToChatRoomMembershipChanges()
        )
        chatRoomIdList.observe(lifecycleOwner, androidx.lifecycle.Observer { serverChatRoomIdList ->
            observeChatRooms(gameId, serverChatRoomIdList)
        })
        chatRoomIdList.onDestroyed = {
            listener.remove()
        }
        return chatRoomList
    }

    /** Should be called after {@link: getChatRoomIds}. Listens to updates on every chat room the
     * player is a member of. */
    private fun observeChatRooms(
        gameId: String,
        chatRoomIdList: List<String>
    ): LiveData<List<ChatRoom>> {
        val chatRoomListenerList = mutableListOf<ListenerRegistration>()
        for (id in chatRoomIdList) {
            chatRoomListenerList.add(
                getChatRoomDocumentReference(gameId, id).addSnapshotListener(
                    EventListener<DocumentSnapshot> { snapshot, e ->
                        if (e != null) {
                            Log.w(TAG, "ChatRoom listen failed. ", e)
                            return@EventListener
                        }
                        if (snapshot == null) {
                            return@EventListener
                        }
                        refreshChatRooms(gameId)
                    })
            )
        }
        chatRoomList.onDestroyed = {
            for (listener in chatRoomListenerList) {
                listener.remove()
            }
        }
        return chatRoomList
    }

    /** Registers an event listener that watches for chat membership changes on the player object. */
    private fun listenToChatRoomMembershipChanges(): EventListener<DocumentSnapshot> {
        return EventListener { snapshot, e ->
            if (e != null) {
                Log.w(TAG, "Listen to chat memberships failed. ", e)
                chatRoomIdList.value = emptyList()
                return@EventListener
            }
            val player = DataConverterUtil.convertSnapshotToPlayer(snapshot!!)
            val chatRoomIds: MutableList<String> = mutableListOf()
            for ((key, value) in player.chatRoomMemberships) {
                if (value.getOrElse(FIELD__IS_VISIBLE) { false }) {
                    chatRoomIds.add(key)
                }
            }
            chatRoomIdList.value = chatRoomIds
        }
    }

    /** One of the chat rooms got an update, we don't know which one so reload all of them. */
    private fun refreshChatRooms(gameId: String) {
        val tasks = chatRoomIdList.value!!.map { chatRoomId ->
            getChatRoomDocumentReference(gameId, chatRoomId).get()
        }
        Tasks.whenAll(tasks).addOnCompleteListener { _ ->
            val updatedList: MutableList<ChatRoom> = mutableListOf()
            for (task in tasks) {
                if (task.isSuccessful) {
                    val snapshot = task.result
                    if (snapshot != null && snapshot.exists()) {
                        updatedList.add(DataConverterUtil.convertSnapshotToChatRoom(snapshot))
                    }
                } else {
                    Log.d(TAG, "Failed to get ChatRoom, ${task.exception}")
                }
            }
            chatRoomList.value = updatedList
        }
    }
}