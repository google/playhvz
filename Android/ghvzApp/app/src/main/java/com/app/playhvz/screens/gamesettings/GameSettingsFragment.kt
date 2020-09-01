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

package com.app.playhvz.screens.gamesettings

import android.os.Bundle
import android.view.*
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.content.ContextCompat
import androidx.core.widget.doOnTextChanged
import androidx.emoji.widget.EmojiEditText
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.app.HvzData
import com.app.playhvz.app.debug.DebugFlags
import com.app.playhvz.common.ConfirmationDialog
import com.app.playhvz.common.UserAvatarPresenter
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.common.playersearch.ChatPlayerSearchDialog
import com.app.playhvz.common.playersearch.PlayerSearchWithinGroupDialog
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.classmodels.Group
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.operations.GameDatabaseOperations
import com.app.playhvz.firebase.operations.GroupDatabaseOperations
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.firebase.viewmodels.GroupViewModel
import com.app.playhvz.firebase.viewmodels.PlayerViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.screens.chatroom.chatinfo.MemberAdapter
import com.app.playhvz.screens.gamelist.JoinGameDialog
import com.app.playhvz.utils.PlayerHelper
import com.app.playhvz.utils.SystemUtils
import com.google.android.gms.tasks.OnSuccessListener
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.runBlocking


/** Fragment for showing a list of Games the user is registered for.*/
class GameSettingsFragment : Fragment() {
    companion object {
        private val TAG = GameSettingsFragment::class.qualifiedName
    }

    private lateinit var adminRecyclerView: RecyclerView
    private lateinit var addAdminButton: MaterialButton
    private lateinit var adminAdapter: MemberAdapter
    private lateinit var gameViewModel: GameViewModel
    private lateinit var errorLabel: TextView
    private lateinit var groupViewModel: GroupViewModel
    private lateinit var playerViewModel: PlayerViewModel
    private lateinit var nameView: EmojiEditText
    private lateinit var submitButton: Button
    private lateinit var gameNameErrorLabel: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var itemsToHideDuringCreation: LinearLayout
    private lateinit var onCallPlayerLayout: LinearLayout
    private lateinit var onCallPlayerAvatarView: ConstraintLayout
    private lateinit var onCallPlayerNameView: TextView
    private lateinit var onCallPlayerIconView: MaterialButton

    private val args: GameSettingsFragmentArgs by navArgs()
    private var adminGroup: Group? = null
    private var gameId: String? = null
    private var playerId: String? = null
    private var game: Game? = null
    private var hasChanges = HvzData<Boolean>(false)
    private var isSaving = false
    private var onCallAdminPlayerId: String? = null
    private var playerHelper: PlayerHelper = PlayerHelper()
    private var toolbarMenu: Menu? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setHasOptionsMenu(true)
        gameId = args.gameId
        gameViewModel = ViewModelProvider(this).get(GameViewModel::class.java)
        groupViewModel = GroupViewModel()
        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        playerViewModel = PlayerViewModel()
        playerId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_PLAYER_ID, null)
        setupObservers()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_game_settings, container, false)
        errorLabel = view.findViewById(R.id.error_label)
        nameView = view.findViewById(R.id.game_name)
        submitButton = view.findViewById(R.id.submit_button)
        gameNameErrorLabel = view.findViewById(R.id.game_name_error_label)
        progressBar = view.findViewById(R.id.progress_bar)
        itemsToHideDuringCreation = view.findViewById(R.id.items_to_hide_during_creation)
        onCallPlayerLayout = view.findViewById(R.id.on_call_player)
        onCallPlayerAvatarView = onCallPlayerLayout.findViewById(R.id.player_avatar_container)!!
        onCallPlayerNameView = onCallPlayerLayout.findViewById(R.id.player_name)!!
        onCallPlayerIconView = onCallPlayerLayout.findViewById(R.id.additional_icon)!!
        addAdminButton = view.findViewById(R.id.add_admin_button)
        adminRecyclerView = view.findViewById(R.id.admin_list)
        adminRecyclerView.layoutManager = LinearLayoutManager(requireContext())
        adminAdapter =
            MemberAdapter(
                listOf(),
                requireContext(), /* onIconClicked= */
                { player -> onRemoveAdminClicked(player) }, /* viewProfile= */
                null
            )
        adminRecyclerView.adapter = adminAdapter

        onCallPlayerLayout.visibility = View.GONE
        onCallPlayerIconView.icon = ContextCompat.getDrawable(requireContext(), R.drawable.ic_edit)
        onCallPlayerIconView.visibility = View.VISIBLE
        onCallPlayerIconView.setOnClickListener {
            changeOnCallAdmin()
        }

        addAdminButton.setOnClickListener {
            val addPeopleDialog = ChatPlayerSearchDialog(gameId!!, adminGroup)
            activity?.supportFragmentManager?.let { addPeopleDialog.show(it, TAG) }
        }

        submitButton.setOnClickListener { _ ->
            if (gameId == null) {
                createGame()
            } else {
                saveChanges()
            }
        }

        if (DebugFlags.isDevEnvironment && gameId != null) {
            val deleteButton = view.findViewById<MaterialButton>(R.id.delete_button)
            deleteButton.icon = ContextCompat.getDrawable(requireContext(), R.drawable.ic_debug)
            deleteButton.visibility = View.VISIBLE
            deleteButton.setOnClickListener { showDeleteDialog() }
        }

        setupToolbar()
        initializeFields()
        return view
    }

    override fun onCreateOptionsMenu(menu: Menu, inflater: MenuInflater) {
        inflater.inflate(R.menu.menu_save_settings, menu)
        toolbarMenu = menu
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.save_option -> {
                saveChanges()
                return true
            }
        }
        return super.onOptionsItemSelected(item)
    }

    override fun onPause() {
        super.onPause()
        SystemUtils.hideKeyboard(requireView())
    }

    fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        if (toolbar != null) {
            toolbar.title =
                if (game == null || game?.name.isNullOrEmpty()) requireContext().getString(R.string.game_settings_create_game_toolbar_title)
                else game?.name
        }
    }

    private fun setupObservers() {
        hasChanges.observe(this, androidx.lifecycle.Observer { updatedHasChanges ->
            if (updatedHasChanges) {
                enableActions()
            } else {
                disableActions()
            }
        })
        if (gameId == null || playerId == null) {
            return
        }
        gameViewModel.getGameAndAdminObserver(this, gameId!!, playerId!!) {
            NavigationUtil.navigateToGameList(
                findNavController(),
                requireActivity()
            )
        }.observe(this, androidx.lifecycle.Observer { serverUpdate ->
            if (hasChanges.value!! && !isSaving) {
                // Someone else updated the game, show an error and ignore pending changes.
                errorLabel.visibility = View.VISIBLE
                disableActions()
                return@Observer
            } else {
                errorLabel.visibility = View.GONE
            }

            updateGame(serverUpdate)
            if (serverUpdate != null) {
                onCallAdminPlayerId = serverUpdate.game?.adminOnCallPlayerId
                listenToAdminOnCallPlayerUpdates()
            }
        })
    }

    private fun updateGame(serverUpdate: GameViewModel.GameWithAdminStatus?) {
        if (serverUpdate == null || serverUpdate.game == null) {
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
        }
        game = serverUpdate!!.game

        groupViewModel.getGroup(gameId!!, game!!.adminGroupId!!)
            .observe(this, androidx.lifecycle.Observer { serverGroup: Group? ->
                updateAdminGroup(serverGroup)
            })

        setupToolbar()
        initializeFields()
    }

    private fun updateAdminGroup(serverGroup: Group?) {
        if (serverGroup == null) {
            return
        }
        adminGroup = serverGroup
        val members = serverGroup.members
        adminAdapter.setGroupOwnerPlayerId(serverGroup.owners)
        adminAdapter.setCanRemovePlayer(serverGroup.settings.canRemoveOthers)
        playerHelper.getListOfPlayers(gameId!!, members)
            .observe(this, androidx.lifecycle.Observer { playerMap ->
                adminAdapter.setData(playerMap)
                adminAdapter.notifyDataSetChanged()
            })
    }

    private fun initializeFields() {
        if (gameId != null) {
            // Disable changing name of already created game
            nameView.setText(game?.name)
            nameView.isEnabled = false
            nameView.isFocusable = false
            disableActions()
        } else {
            // Setup UI for creating a new game
            itemsToHideDuringCreation.visibility = View.GONE
            nameView.doOnTextChanged { text, _, _, _ ->
                when {
                    text.isNullOrEmpty() -> {
                        submitButton.isEnabled = false
                    }
                    text.contains(Regex("\\s")) -> {
                        submitButton.isEnabled = false
                        gameNameErrorLabel.setText(R.string.error_whitespace)
                        gameNameErrorLabel.visibility = View.VISIBLE
                        return@doOnTextChanged
                    }
                    else -> {
                        submitButton.setEnabled(true)
                    }
                }
                gameNameErrorLabel.visibility = View.GONE
            }
        }
    }

    private fun createGame() {
        val name = nameView.text
        val gameCreatedListener = OnSuccessListener<String> { _ ->
            SystemUtils.showToast(context, getString(R.string.create_game_success_toast, name))
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
            haveAdminCreatePlayer(name.toString())
        }
        val gameExistsListener = {
            SystemUtils.showToast(context, "$name already exists!")
            progressBar.visibility = View.INVISIBLE
            gameNameErrorLabel.setText(resources.getString(R.string.create_game_error_exists, name))
            gameNameErrorLabel.visibility = View.VISIBLE
        }
        runBlocking {
            EspressoIdlingResource.increment()
            progressBar.visibility = View.VISIBLE
            GameDatabaseOperations.asyncTryToCreateGame(
                name.toString(),
                gameCreatedListener,
                gameExistsListener
            )
            EspressoIdlingResource.decrement()
        }
    }

    private fun listenToAdminOnCallPlayerUpdates() {
        if (onCallAdminPlayerId.isNullOrEmpty()) {
            onCallPlayerLayout.visibility = View.GONE
            return
        }
        playerViewModel.getPlayer(gameId!!, onCallAdminPlayerId!!)
            .observe(viewLifecycleOwner, androidx.lifecycle.Observer { serverPlayer: Player? ->
                if (serverPlayer == null) {
                    onCallPlayerLayout.visibility = View.GONE
                    return@Observer
                }
                updateOnCallPlayerUI(serverPlayer)
            })
    }

    private fun updateOnCallPlayerUI(updatedPlayer: Player) {
        onCallPlayerLayout.visibility = View.VISIBLE
        val userAvatarPresenter = UserAvatarPresenter(onCallPlayerAvatarView, R.dimen.avatar_small)
        userAvatarPresenter.renderAvatar(updatedPlayer)
        onCallPlayerNameView.text = updatedPlayer.name
    }

    private fun haveAdminCreatePlayer(gameName: String) {
        val joinGameDialog = JoinGameDialog(this)
        joinGameDialog.setGameName(gameName)
        activity?.supportFragmentManager?.let { joinGameDialog.show(it, TAG) }
    }

    private fun changeOnCallAdmin() {
        val onPlayerSelected = { selectedId: String ->
            onCallAdminPlayerId = selectedId
            listenToAdminOnCallPlayerUpdates()
            if (!hasChanges.value!!) {
                hasChanges.value = true
            }
        }
        val selectPersonDialog =
            PlayerSearchWithinGroupDialog(gameId!!, adminGroup, onPlayerSelected)
        activity?.supportFragmentManager?.let { selectPersonDialog.show(it, TAG) }
    }

    private fun saveChanges() {
        if (!hasChanges.value!! || errorLabel.visibility == View.VISIBLE || game == null) {
            return
        }
        isSaving = true
        disableActions()
        progressBar.visibility = View.VISIBLE
        val onSuccess = {
            NavigationUtil.navigateToGameDashboard(findNavController(), gameId)
        }
        game?.adminOnCallPlayerId = onCallAdminPlayerId
        runBlocking {
            EspressoIdlingResource.increment()
            GameDatabaseOperations.asyncUpdateGame(
                game!!,
                onSuccess,
                {
                    isSaving = false
                    enableActions()
                    SystemUtils.showToast(context, "Couldn't save changes.")
                }
            )
            EspressoIdlingResource.decrement()
        }
    }

    private fun showDeleteDialog() {
        val deleteDialog = ConfirmationDialog(
            getString(R.string.game_settings_delete_dialog_title, game?.name),
            R.string.game_settings_delete_dialog_description,
            R.string.game_settings_delete_dialog_confirmation,
            R.string.game_settings_delete_dialog_cancel
        )
        deleteDialog.setPositiveButtonCallback {
            if (gameId != null) {
                runBlocking {
                    EspressoIdlingResource.increment()
                    GameDatabaseOperations.asyncDeleteGame(
                        gameId!!
                    ) {
                        SystemUtils.showToast(context, "Deleted game")
                        SystemUtils.clearSharedPrefs(requireActivity())
                        NavigationUtil.navigateToGameList(findNavController(), requireActivity())
                    }
                    EspressoIdlingResource.decrement()
                }
            }
        }
        activity?.supportFragmentManager?.let { deleteDialog.show(it, TAG) }
    }


    private fun onRemoveAdminClicked(player: Player) {
        val leaveConfirmationDialog = ConfirmationDialog(
            getString(R.string.chat_info_remove_dialog_title, player.name),
            R.string.chat_info_remove_dialog_description,
            R.string.chat_info_remove_dialog_confirmation
        )
        leaveConfirmationDialog.setPositiveButtonCallback {
            runBlocking {
                EspressoIdlingResource.increment()
                GroupDatabaseOperations.asyncRemovePlayerFromGroup(
                    gameId!!,
                    player.id!!,
                    game!!.adminGroupId!!,
                    {
                        SystemUtils.showToast(requireContext(), "Successfully removed player")
                    },
                    {})
                EspressoIdlingResource.decrement()
            }
        }
        activity?.supportFragmentManager?.let { leaveConfirmationDialog.show(it, TAG) }
    }

    private fun disableActions() {
        if (toolbarMenu == null) {
            return
        }
        SystemUtils.hideKeyboard(requireView())
        val menuItem = toolbarMenu?.findItem(R.id.save_option)
        menuItem?.icon?.mutate()?.alpha = 130
        menuItem?.isEnabled = false
        submitButton.isEnabled = false
    }

    private fun enableActions() {
        if (toolbarMenu == null) {
            return
        }
        progressBar.visibility = View.GONE
        val menuItem = toolbarMenu?.findItem(R.id.save_option)
        menuItem?.icon?.mutate()?.alpha = 255
        menuItem?.isEnabled = true
        submitButton.isEnabled = true
    }

}