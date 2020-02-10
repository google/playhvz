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

package com.app.playhvz.screens.chatroom.chatinfo

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import androidx.appcompat.app.ActionBar
import androidx.appcompat.app.AppCompatActivity
import androidx.emoji.widget.EmojiTextView
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.navArgs
import com.app.playhvz.R
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.CURRENT_GAME_ID
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.CURRENT_PLAYER_ID
import com.app.playhvz.firebase.classmodels.ChatRoom
import com.app.playhvz.firebase.viewmodels.ChatRoomViewModel

/** Fragment for showing a list of Chatrooms the user is a member of.*/
class ChatInfoFragment : Fragment() {
    companion object {
        private val TAG = ChatInfoFragment::class.qualifiedName
    }

    lateinit var chatViewModel: ChatRoomViewModel

    private lateinit var chatRoomId: String
    private lateinit var progressBar: ProgressBar
    private lateinit var chatNameView: EmojiTextView

    private val args: ChatInfoFragmentArgs by navArgs()
    private var gameId: String? = null
    private var playerId: String? = null
    private var toolbar: ActionBar? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        chatRoomId = args.chatRoomId
        chatViewModel = ChatRoomViewModel()

        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(CURRENT_GAME_ID, null)
        playerId = sharedPrefs.getString(CURRENT_PLAYER_ID, null)

        toolbar = (activity as AppCompatActivity).supportActionBar
        setupObservers()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_chat_info, container, false)
        progressBar = view.findViewById(R.id.progress_bar)
        chatNameView = view.findViewById(R.id.chat_name)
        progressBar.visibility = View.GONE
        setupToolbar()
        return view
    }

    fun setupToolbar() {
        toolbar?.title = getString(R.string.chat_info_title)
        toolbar?.setDisplayHomeAsUpEnabled(false)
    }

    private fun setupObservers() {
        if (gameId.isNullOrEmpty() || playerId.isNullOrEmpty()) {
            return
        }
        chatViewModel.getChatRoomObserver(this, gameId!!, chatRoomId)
            .observe(this, androidx.lifecycle.Observer { serverChatRoom ->
                onChatRoomUpdated(serverChatRoom)
            })
        /*
        chatViewModel.getMessagesObserver(this, gameId!!, chatRoomId)
            .observe(this, androidx.lifecycle.Observer { serverMessageList ->
                onMessagesUpdated(serverMessageList)
            }) */
    }

    /** Update data and notify view and adapter of change. */
    private fun onChatRoomUpdated(updatedChatRoom: ChatRoom) {
        chatNameView.text = updatedChatRoom.name
    }

    private fun updateView() {
        if (this.view == null) {
            return
        }
        progressBar.visibility = View.GONE
    }
}