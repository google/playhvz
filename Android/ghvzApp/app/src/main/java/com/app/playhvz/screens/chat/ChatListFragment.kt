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

package com.app.playhvz.screens.chat

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.CURRENT_GAME_ID
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.CURRENT_PLAYER_ID
import com.app.playhvz.firebase.classmodels.ChatRoom
import com.app.playhvz.firebase.viewmodels.ChatListViewModel
import com.google.android.material.floatingactionbutton.FloatingActionButton


/** Fragment for showing a list of Chatrooms the user is a member of.*/
class ChatListFragment : Fragment(), ChatListAdapter.IFragmentNavigator {
    companion object {
        private val TAG = ChatListFragment::class.qualifiedName
    }

    lateinit var chatListViewModel: ChatListViewModel
    lateinit var chatListAdapter: ChatListAdapter

    private lateinit var progressBar: ProgressBar

    private var fab: FloatingActionButton? = null
    private var gameId: String? = null
    private var playerId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        chatListViewModel = ChatListViewModel()
        chatListAdapter = ChatListAdapter(listOf(), context!!, this)

        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(CURRENT_GAME_ID, null)
        playerId = sharedPrefs.getString(CURRENT_PLAYER_ID, null)

        setupObservers()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_chat_list, container, false)
        progressBar = view.findViewById(R.id.progress_bar)
        fab = activity?.findViewById(R.id.floating_action_button)
        val chatListRecyclerView = view.findViewById<RecyclerView>(R.id.chatroom_list)
        chatListRecyclerView.layoutManager = LinearLayoutManager(context)
        chatListRecyclerView.adapter = chatListAdapter
        setupFab()
        return view
    }

    override fun onChatroomClicked(chatroomId: String) {
        // TODO: implement opening chat room
        //NavigationUtil.navigateToChat(findNavController(), gameId)
    }

    private fun setupObservers() {
        if (gameId.isNullOrEmpty() || playerId.isNullOrEmpty()) {
            return
        }
        chatListViewModel.getChatRoomList(this, gameId!!, playerId!!)
            .observe(this, androidx.lifecycle.Observer { serverChatRoomList ->
                onChatRoomUpdated(serverChatRoomList)
            })
    }

    private fun setupFab() {
        fab?.setOnClickListener {
            createChat()
        }
        fab?.visibility = View.VISIBLE
    }

    /** Update data and notify view and adapter of change. */
    private fun onChatRoomUpdated(updatedChatRoomList: List<ChatRoom>) {
        updateView()
        chatListAdapter.setData(updatedChatRoomList)
        chatListAdapter.notifyDataSetChanged()
    }

    private fun updateView() {
        if (this.view == null) {
            return
        }
        progressBar.visibility = View.GONE
    }

    private fun createChat() {
        // TODO: implement creating a new chat
        /*val joinGameDialog = JoinGameDialog()
         joinGameDialog.setPositiveButtonCallback {
             val gameName = joinGameDialog.getGameNameProposal()

             val gameJoinedListener = {
                 Toast.makeText(context, "Joined the game!", Toast.LENGTH_LONG).show()
             }
             val gameDoesNotExistsListener = {
                 Toast.makeText(context, "$gameName does not exist!", Toast.LENGTH_LONG).show()
             }
             runBlocking {
                 EspressoIdlingResource.increment()
                 GameDatabaseOperations.asyncTryToJoinGame(
                     gameName,
                     gameJoinedListener,
                     gameDoesNotExistsListener
                 )
                 EspressoIdlingResource.decrement()
             }
         }
        activity?.supportFragmentManager?.let { joinGameDialog.show(it, TAG) }*/
    }
}