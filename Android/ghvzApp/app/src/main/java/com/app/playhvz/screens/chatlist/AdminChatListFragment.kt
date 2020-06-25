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

package com.app.playhvz.screens.chatlist

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import androidx.appcompat.app.ActionBar
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.CURRENT_GAME_ID
import com.app.playhvz.firebase.classmodels.ChatRoom
import com.app.playhvz.firebase.viewmodels.ChatListViewModel
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.google.android.material.floatingactionbutton.FloatingActionButton


/** Fragment for showing a list of Chatrooms the admin figurehead is a member of.*/
class AdminChatListFragment : Fragment(), ChatListAdapter.IFragmentNavigator {
    companion object {
        private val TAG = AdminChatListFragment::class.qualifiedName
    }

    lateinit var chatListViewModel: ChatListViewModel
    lateinit var chatListAdapter: ChatListAdapter

    private lateinit var progressBar: ProgressBar

    private var adminPlayerId: String? = null
    private var fab: FloatingActionButton? = null
    private var gameId: String? = null
    private var toolbar: ActionBar? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        chatListViewModel = ChatListViewModel()
        chatListAdapter = ChatListAdapter(listOf(), requireContext(), this)

        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(CURRENT_GAME_ID, null)
        toolbar = (activity as AppCompatActivity).supportActionBar
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        setupObservers()
        val view = inflater.inflate(R.layout.fragment_chat_list, container, false)
        progressBar = view.findViewById(R.id.progress_bar)
        fab = activity?.findViewById(R.id.floating_action_button)
        val chatListRecyclerView = view.findViewById<RecyclerView>(R.id.chatroom_list)
        chatListRecyclerView.layoutManager = LinearLayoutManager(context)
        chatListRecyclerView.adapter = chatListAdapter
        setupFab()
        setupToolbar()
        return view
    }

    override fun onChatRoomClicked(chatRoomId: String) {
        NavigationUtil.navigateToChatRoom(findNavController(), chatRoomId, adminPlayerId!!)
    }

    fun setupToolbar() {
        toolbar?.title = getString(R.string.chat_list_for_admin_toolbar)
        toolbar?.setDisplayHomeAsUpEnabled(true)
    }

    private fun setupObservers() {
        if (gameId.isNullOrEmpty()) {
            return
        }

        val gameViewModel = GameViewModel()
        gameViewModel.getGame(gameId!!, {})
            .observe(this, androidx.lifecycle.Observer { game ->
                if (game == null) {
                    return@Observer
                }
                adminPlayerId = game.figureheadAdminPlayerAccount
                chatListViewModel.getChatRoomList(this, gameId!!, adminPlayerId!!)
                    .observe(viewLifecycleOwner, androidx.lifecycle.Observer { serverChatRoomList ->
                        progressBar.visibility = View.GONE
                        onChatRoomUpdated(serverChatRoomList)
                    })
            })
    }

    private fun setupFab() {
        fab?.setOnClickListener {
            createChat()
        }
        fab?.visibility = View.VISIBLE
    }

    /** Update data and notify view and adapter of change. */
    private fun onChatRoomUpdated(updatedChatRoomList: Map<String, ChatRoom?>) {
        chatListAdapter.setData(updatedChatRoomList)
        chatListAdapter.notifyDataSetChanged()
    }

    private fun createChat() {
        val createChatDialog = CreateChatDialog(gameId!!, adminPlayerId!!)
        activity?.supportFragmentManager?.let { createChatDialog.show(it, TAG) }
    }
}