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
import androidx.emoji.widget.EmojiTextView
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.ConfirmationDialog
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.CURRENT_GAME_ID
import com.app.playhvz.common.playersearch.PlayerSearchDialog
import com.app.playhvz.firebase.classmodels.Group
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.classmodels.Player.Companion.FIELD__CHAT_MEMBERSHIP_ALLOW_NOTIFICATIONS
import com.app.playhvz.firebase.operations.ChatDatabaseOperations
import com.app.playhvz.firebase.operations.PlayerDatabaseOperations
import com.app.playhvz.firebase.viewmodels.ChatRoomViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.utils.PlayerHelper
import com.app.playhvz.utils.SystemUtils
import com.google.android.material.switchmaterial.SwitchMaterial
import kotlinx.coroutines.runBlocking

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
    private lateinit var notificationOption: SwitchMaterial
    private lateinit var playerId: String
    private lateinit var progressBar: ProgressBar

    private val args: ChatInfoFragmentArgs by navArgs()
    private var currentPlayer: Player? = null
    private var gameId: String? = null
    private var group: Group? = null
    private var playerHelper: PlayerHelper = PlayerHelper()
    private var isChatWithAdmins: Boolean = false
    private var toolbar: ActionBar? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        chatRoomId = args.chatRoomId
        playerId = args.playerId
        isChatWithAdmins = args.isChatWithAdmins
        chatViewModel = ChatRoomViewModel()
        memberAdapter =
            MemberAdapter(
                listOf(),
                requireContext(), /* onIconClicked= */
                { player -> onRemovePlayerClicked(player) }, /* viewProfile= */
                { playerId -> viewPlayerProfile(playerId) })

        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(CURRENT_GAME_ID, null)

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
        notificationOption = view.findViewById(R.id.notifications_option)
        memberCountView = view.findViewById(R.id.member_count)

        progressBar.visibility = View.GONE
        setupToolbar()

        addPeopleOption.setOnClickListener { _ -> onAddPeopleClicked() }
        leaveOption.setOnClickListener { _ -> onLeaveClicked() }
        notificationOption.setOnCheckedChangeListener { _, isChecked ->
            onNotificationOptionChanged(
                isChecked
            )
        }

        val memberRecyclerView = view.findViewById<RecyclerView>(R.id.member_list)
        val layoutManager = LinearLayoutManager(context)
        memberRecyclerView.layoutManager = layoutManager
        memberRecyclerView.adapter = memberAdapter

        return view
    }

    fun setupToolbar() {
        toolbar?.title = getString(R.string.chat_info_title)
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
        group = updatedGroup
        chatNameView.text = updatedGroup.name
        val count = updatedGroup.members.size
        memberCountView.text =
            resources.getQuantityString(R.plurals.chat_info_member_count, count, count)

        addPeopleOption.visibility = if (updatedGroup.settings.canAddOthers) VISIBLE else GONE
        leaveOption.visibility = if (updatedGroup.settings.canRemoveSelf) VISIBLE else GONE

        memberAdapter.setCanRemovePlayer(updatedGroup.settings.canRemoveOthers)
        memberAdapter.setGroupOwnerPlayerId(updatedGroup.owners)
        playerHelper.getListOfPlayers(gameId!!, updatedGroup.members)
            .observe(this, androidx.lifecycle.Observer { playerMap ->
                memberAdapter.setData(playerMap)
                memberAdapter.notifyDataSetChanged()
                currentPlayer = playerMap[playerId]
                if (currentPlayer != null) {
                    notificationOption.isChecked = getCurrentNotificationSetting()
                }
            })
    }

    private fun onAddPeopleClicked() {
        val addPeopleDialog = PlayerSearchDialog(gameId!!, group, chatRoomId)
        activity?.supportFragmentManager?.let { addPeopleDialog.show(it, TAG) }
    }

    private fun onLeaveClicked() {
        val dialogDescription = if (isChatWithAdmins) {
            R.string.chat_info_leave_dialog_with_admins_description
        } else {
            R.string.chat_info_leave_dialog_description
        }
        val leaveConfirmationDialog =
            ConfirmationDialog(
                getString(R.string.chat_info_leave_dialog_title, chatViewModel.getChatName()),
                dialogDescription,
                R.string.chat_info_leave_dialog_confirmation
            )
        leaveConfirmationDialog.setPositiveButtonCallback {
            progressBar.visibility = View.VISIBLE
            runBlocking {
                EspressoIdlingResource.increment()
                ChatDatabaseOperations.asyncRemovePlayerFromChatRoom(
                    gameId!!,
                    playerId,
                    chatRoomId,
                    {
                        progressBar.visibility = View.GONE
                        if (isChatWithAdmins) {
                            NavigationUtil.navigateToGameDashboard(findNavController(), gameId)
                        } else {
                            NavigationUtil.navigateToChatList(findNavController())
                        }
                    },
                    {})
                EspressoIdlingResource.decrement()
            }
        }
        activity?.supportFragmentManager?.let { leaveConfirmationDialog.show(it, TAG) }
    }

    private fun onNotificationOptionChanged(isChecked: Boolean) {
        if (isChecked == getCurrentNotificationSetting()) {
            // Setting is same as last known server setting, do nothing.
            return
        }
        progressBar.visibility = VISIBLE
        notificationOption.isEnabled = false
        runBlocking {
            EspressoIdlingResource.increment()
            PlayerDatabaseOperations.asyncUpdatePlayerChatNotificationSetting(
                gameId,
                playerId,
                chatRoomId,
                isChecked,
                {
                    notificationOption.isEnabled = true
                    progressBar.visibility = GONE
                },
                {
                    notificationOption.isEnabled = true
                    progressBar.visibility = GONE
                    SystemUtils.showToast(context, "Couldn't save changes.")
                }
            )
            EspressoIdlingResource.decrement()
        }

    }

    private fun onRemovePlayerClicked(player: Player) {
        val leaveConfirmationDialog = ConfirmationDialog(
            getString(R.string.chat_info_remove_dialog_title, player.name),
            R.string.chat_info_remove_dialog_description,
            R.string.chat_info_remove_dialog_confirmation
        )
        leaveConfirmationDialog.setPositiveButtonCallback {
            runBlocking {
                EspressoIdlingResource.increment()
                ChatDatabaseOperations.asyncRemovePlayerFromChatRoom(
                    gameId!!,
                    player.id!!,
                    chatRoomId,
                    {
                        SystemUtils.showToast(requireContext(), "Successfully removed player")
                    },
                    {})
                EspressoIdlingResource.decrement()
            }
        }
        activity?.supportFragmentManager?.let { leaveConfirmationDialog.show(it, TAG) }
    }

    private fun getCurrentNotificationSetting(): Boolean {
        val default = true
        if (currentPlayer == null) {
            return default
        }
        return currentPlayer!!.chatRoomMemberships[chatRoomId]?.get(
            FIELD__CHAT_MEMBERSHIP_ALLOW_NOTIFICATIONS
        ) ?: default
    }

    private fun viewPlayerProfile(playerToView: String) {
        NavigationUtil.navigateToPlayerProfile(findNavController(), gameId, playerToView)

    }
}