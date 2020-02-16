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
import android.view.View.GONE
import android.view.View.VISIBLE
import android.view.ViewGroup
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.ActionBar
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.emoji.widget.EmojiTextView
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.CURRENT_GAME_ID
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.CURRENT_PLAYER_ID
import com.app.playhvz.firebase.classmodels.Group
import com.app.playhvz.firebase.viewmodels.ChatRoomViewModel
import com.app.playhvz.utils.PlayerHelper

/** Fragment for showing a list of Chatrooms the user is a member of.*/
class ChatInfoFragment : Fragment() {
    companion object {
        private val TAG = ChatInfoFragment::class.qualifiedName
    }

    lateinit var chatViewModel: ChatRoomViewModel

    private lateinit var addPeopleOption: TextView
    private lateinit var chatNameView: EmojiTextView
    private lateinit var chatRoomId: String
    private lateinit var divider: View
    private lateinit var leaveOption: TextView
    private lateinit var memberCountView: TextView
    private lateinit var memberAdapter: MemberAdapter
    private lateinit var progressBar: ProgressBar


    private val args: ChatInfoFragmentArgs by navArgs()
    private var gameId: String? = null
    private var playerHelper: PlayerHelper = PlayerHelper()
    private var playerId: String? = null
    private var toolbar: ActionBar? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        chatRoomId = args.chatRoomId
        chatViewModel = ChatRoomViewModel()
        memberAdapter = MemberAdapter(listOf(), context!!, this)


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
        divider = view.findViewById(R.id.divider_below_options)
        addPeopleOption = view.findViewById(R.id.add_people_option)
        leaveOption = view.findViewById(R.id.leave_option)
        memberCountView = view.findViewById(R.id.member_count)

        progressBar.visibility = View.GONE
        setupToolbar()

        addPeopleOption.setOnClickListener { v -> onAddPeopleClicked(v) }
        leaveOption.setOnClickListener { v -> onLeaveClicked(v) }

        val memberRecyclerView = view.findViewById<RecyclerView>(R.id.member_list)
        val layoutManager = LinearLayoutManager(context)
        memberRecyclerView.layoutManager = layoutManager
        memberRecyclerView.adapter = memberAdapter

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
        chatViewModel.getGroupObserver(this, gameId!!, chatRoomId)
            .observe(this, androidx.lifecycle.Observer { serverGroup ->
                onGroupUpdated(serverGroup)
            })
    }

    /** Update data and notify view and adapter of change. */
    private fun onGroupUpdated(updatedGroup: Group) {
        chatNameView.text = updatedGroup.name
        val count = updatedGroup.members.size
        memberCountView.text =
            resources.getQuantityString(R.plurals.chat_info_member_count, count, count)

        addPeopleOption.visibility = if (updatedGroup.settings.canAddOthers) VISIBLE else GONE
        leaveOption.visibility = if (updatedGroup.settings.canRemoveSelf) VISIBLE else GONE

        divider.visibility =
            if (addPeopleOption.isVisible || leaveOption.isVisible) VISIBLE else GONE

        playerHelper.getListOfPlayers(gameId!!, updatedGroup.members)
            .observe(this, androidx.lifecycle.Observer { playerMap ->
                memberAdapter.setData(playerMap)
                memberAdapter.notifyDataSetChanged()
            })
    }

    private fun updateView() {
        if (this.view == null) {
            return
        }
        progressBar.visibility = View.GONE
    }

    private fun onAddPeopleClicked(view: View) {
        // TODO: implement adding people
    }

    private fun onLeaveClicked(view: View) {
        // TODO: implement leaving
    }
}