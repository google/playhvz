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

package com.app.playhvz.screens.player

import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.emoji.widget.EmojiTextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.PhotoUploadDialog
import com.app.playhvz.common.UserAvatarPresenter
import com.app.playhvz.common.globals.CrossClientConstants.Companion.HUMAN
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.UploadService.Companion.getProfileImageName
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.classmodels.Reward
import com.app.playhvz.firebase.operations.PlayerDatabaseOperations
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.firebase.viewmodels.PlayerRewardViewModel
import com.app.playhvz.firebase.viewmodels.PlayerViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.utils.SystemUtils
import com.google.android.flexbox.FlexWrap
import com.google.android.flexbox.FlexboxLayoutManager
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.runBlocking


/** Fragment for showing a list of Games the user is registered for.*/
class ProfileFragment : Fragment() {
    companion object {
        internal val TAG = ProfileFragment::class.qualifiedName
    }

    val args: ProfileFragmentArgs by navArgs()

    lateinit var gameViewModel: GameViewModel
    lateinit var playerViewModel: PlayerViewModel
    lateinit var rewardViewModel: PlayerRewardViewModel
    lateinit var userAvatarPresenter: UserAvatarPresenter

    private lateinit var allegianceView: TextView
    private lateinit var avatarView: View
    private lateinit var avatarEditIcon: ImageView
    private lateinit var nameView: EmojiTextView
    private lateinit var lifeCodeIcon: ImageView
    private lateinit var lifeCodeRecyclerView: RecyclerView
    private lateinit var lifeCodeAdapter: LifeCodeAdapter
    private lateinit var progressBar: ProgressBar
    private lateinit var adminOptionsContainer: ConstraintLayout
    private lateinit var rewardRecyclerView: RecyclerView
    private lateinit var rewardAdapter: RewardAdapter

    var gameId: String? = null
    var playerId: String? = null
    var currentUserPlayerId: String? = null
    var game: Game? = null
    var player: Player? = null
    var isAdmin: Boolean = false
    var isViewingMyOwnProfile: Boolean = false

    private var expandAdminOptionsButton: MaterialButton? = null
    private var collapsibleAdminOptionsSection: LinearLayout? = null
    private var changeAllegianceButton: MaterialButton? = null
    private var giveRewardButton: MaterialButton? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        gameId = args.gameId
        playerId = args.playerId
        gameViewModel = ViewModelProvider(requireActivity()).get(GameViewModel::class.java)
        isViewingMyOwnProfile = playerId == null
        playerViewModel = if (!isViewingMyOwnProfile) {
            // Use a temporary player view model since we're viewing a random player.
            PlayerViewModel()
        } else {
            // Reuse existing player view model since we're viewing the current player's profile.
            ViewModelProvider(this).get(PlayerViewModel::class.java)
        }
        rewardViewModel = PlayerRewardViewModel()
        lifeCodeAdapter = LifeCodeAdapter(listOf(), requireContext())
        rewardAdapter = RewardAdapter(requireContext(), requireActivity().supportFragmentManager)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_player_profile, container, false)
        progressBar = view.findViewById(R.id.progress_bar)
        adminOptionsContainer = view.findViewById(R.id.admin_options_container)
        nameView = view.findViewById(R.id.player_name)
        avatarView = view.findViewById(R.id.player_avatar)
        avatarEditIcon = view.findViewById(R.id.player_avatar_edit_icon)
        allegianceView = view.findViewById(R.id.player_allegiance)
        lifeCodeIcon = view.findViewById(R.id.player_life_code_icon)
        lifeCodeRecyclerView = view.findViewById(R.id.player_life_code_list)
        lifeCodeRecyclerView.layoutManager = LinearLayoutManager(context)
        lifeCodeRecyclerView.adapter = lifeCodeAdapter
        rewardRecyclerView = view.findViewById(R.id.player_reward_list)
        val flexLayout = FlexboxLayoutManager(requireContext())
        flexLayout.flexWrap = FlexWrap.WRAP
        rewardRecyclerView.layoutManager = flexLayout
        rewardRecyclerView.adapter = rewardAdapter


        userAvatarPresenter = UserAvatarPresenter(avatarView, R.dimen.avatar_xl)

        setupAvatarUi()
        setupObservers()
        setupToolbar()
        return view
    }

    fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        if (toolbar != null) {
            toolbar.title =
                if (gameViewModel.getGame()?.value?.name.isNullOrEmpty()) requireContext().getString(
                    R.string.app_name
                )
                else gameViewModel.getGame()?.value?.name
        }
    }

    private fun setupObservers() {
        if (gameId.isNullOrEmpty()) {
            return
        }
        if (isViewingMyOwnProfile) {
            // Get current user's player for this game
            if (currentUserPlayerId == null) {
                val sharedPrefs = activity?.getSharedPreferences(
                    SharedPreferencesConstants.PREFS_FILENAME,
                    0
                )!!
                currentUserPlayerId =
                    sharedPrefs.getString(SharedPreferencesConstants.CURRENT_PLAYER_ID, null)
            }
            playerViewModel.getPlayer(gameId!!, currentUserPlayerId!!)
                .observe(viewLifecycleOwner, androidx.lifecycle.Observer { serverPlayer ->
                    updatePlayer(serverPlayer)
                })
        } else {
            playerViewModel.getPlayer(gameId!!, playerId!!)
                .observe(viewLifecycleOwner, androidx.lifecycle.Observer { serverPlayer ->
                    updatePlayer(serverPlayer)
                })
        }

        if (currentUserPlayerId == null) {
            val sharedPrefs = activity?.getSharedPreferences(
                SharedPreferencesConstants.PREFS_FILENAME,
                0
            )!!
            currentUserPlayerId =
                sharedPrefs.getString(SharedPreferencesConstants.CURRENT_PLAYER_ID, null)
        }

        // Monitor if the current user is an admin.
        gameViewModel.getGameAndAdminObserver(this, gameId!!, currentUserPlayerId!!) {
            NavigationUtil.navigateToGameList(
                findNavController(),
                requireActivity()
            )
        }.observe(viewLifecycleOwner, androidx.lifecycle.Observer { serverUpdate ->
            if (serverUpdate != null) {
                isAdmin = serverUpdate.isAdmin
                setupAdminUi()
            }
        })
    }

    private fun updatePlayer(serverPlayer: Player?) {
        player = serverPlayer
        if (serverPlayer == null) {
            return
        }
        nameView.setText(serverPlayer.name)
        userAvatarPresenter.renderAvatar(serverPlayer)
        allegianceView.setText(serverPlayer.allegiance)

        if (serverPlayer.allegiance == HUMAN && isViewingMyOwnProfile) {
            // Only show lifecodes if we're viewing our own profile
            lifeCodeAdapter.setData(serverPlayer.lifeCodes)
            lifeCodeAdapter.notifyDataSetChanged()
            lifeCodeRecyclerView.visibility = View.VISIBLE
            lifeCodeIcon.visibility = View.VISIBLE
        } else {
            lifeCodeRecyclerView.visibility = View.GONE
            lifeCodeIcon.visibility = View.GONE
        }
        rewardViewModel.getPlayersRewards(viewLifecycleOwner, gameId!!, serverPlayer.rewards)
            .observe(viewLifecycleOwner, androidx.lifecycle.Observer { updatedRewards ->
                updateRewardUi(updatedRewards)
            })
    }

    private fun updatePlayerAvatarUrl(uri: Uri?) {
        if (uri == null || gameId == null || player == null) {
            return
        }
        progressBar.visibility = View.VISIBLE
        runBlocking {
            EspressoIdlingResource.increment()
            PlayerDatabaseOperations.asyncUpdatePlayerProfileImage(
                gameId,
                player!!.id,
                uri.toString(),
                {
                    progressBar.visibility = View.GONE
                    player!!.avatarUrl = uri.toString()
                    userAvatarPresenter.renderAvatar(player!!)
                },
                {
                    progressBar.visibility = View.GONE
                    SystemUtils.showToast(context, "Couldn't save changes.")
                }
            )
            EspressoIdlingResource.decrement()
        }
    }

    private fun setupAdminUi() {
        if (!isAdmin) {
            adminOptionsContainer.visibility = View.GONE
            return
        }
        adminOptionsContainer.visibility = View.VISIBLE
        if (expandAdminOptionsButton == null) {
            expandAdminOptionsButton = view?.findViewById(R.id.more_less_button)
        }
        if (collapsibleAdminOptionsSection == null) {
            collapsibleAdminOptionsSection =
                view?.findViewById(R.id.admin_options_collapsible_section)
        }
        expandAdminOptionsButton!!.setOnClickListener { v ->
            val isCollapsed = collapsibleAdminOptionsSection!!.visibility == View.GONE
            collapsibleAdminOptionsSection!!.visibility =
                if (isCollapsed) View.VISIBLE else View.GONE
            expandAdminOptionsButton!!.setIconResource(
                if (isCollapsed) R.drawable.ic_expand_less else R.drawable.ic_expand_more
            )
            expandAdminOptionsButton!!.contentDescription =
                if (isCollapsed)
                    v.resources.getString(R.string.button_collapse_content_description)
                else
                    v.resources.getString(R.string.button_expand_content_description)
        }

        if (changeAllegianceButton == null) {
            changeAllegianceButton = view?.findViewById(R.id.change_allegiance_button)
        }
        changeAllegianceButton!!.setOnClickListener {
            val allegianceDialog = SetAllegianceDialog(
                player!!.allegiance,
                { newAllegiance -> setAllegiance(newAllegiance) })
            activity?.supportFragmentManager?.let {
                allegianceDialog.show(it, TAG)
            }

        }

        if (giveRewardButton == null) {
            giveRewardButton = view?.findViewById(R.id.give_reward_button)
        }
        val playerToAward = if (isViewingMyOwnProfile) currentUserPlayerId else playerId
        giveRewardButton!!.setOnClickListener {
            val rewardDialog = RewardSelectorDialog(
                gameId!!,
                playerToAward!!
            )
            activity?.supportFragmentManager?.let {
                rewardDialog.show(it, TAG)
            }

        }
    }

    private fun setupAvatarUi() {
        if (!isViewingMyOwnProfile) {
            avatarEditIcon.visibility = View.GONE
        } else {
            avatarView.setOnClickListener {
                if (player == null) {
                    return@setOnClickListener
                }
                val photoUrl: String? = player!!.avatarUrl
                val photoUploadDialog =
                    PhotoUploadDialog(getProfileImageName(player!!), photoUrl) { uri: Uri? ->
                        updatePlayerAvatarUrl(uri)
                    }
                photoUploadDialog.setPositiveButtonCallback {
                    progressBar.visibility = View.VISIBLE
                }
                activity?.supportFragmentManager?.let {
                    photoUploadDialog.show(
                        it,
                        TAG
                    )
                }
            }
        }
    }

    private fun setAllegiance(allegiance: String) {
        runBlocking {
            EspressoIdlingResource.increment()
            val playerToChange = if (playerId.isNullOrBlank()) currentUserPlayerId!! else playerId!!
            PlayerDatabaseOperations.setPlayerAllegiance(
                gameId!!,
                playerToChange,
                allegiance,
                {},
                {})
            EspressoIdlingResource.decrement()
        }
    }

    private fun updateRewardUi(updatedRewards: Map<String, Pair<Reward?, Int>>) {
        rewardAdapter.setData(updatedRewards)
    }
}
