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

package com.app.playhvz.screens.rewards.rewardsettings

import android.net.Uri
import android.os.Bundle
import android.view.*
import android.widget.EditText
import android.widget.ImageView
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.widget.doOnTextChanged
import androidx.emoji.widget.EmojiEditText
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.ConfirmationDialog
import com.app.playhvz.common.PhotoUploadDialog
import com.app.playhvz.common.globals.CrossClientConstants.Companion.DEFAULT_REWARD_POINT_VALUE
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.UploadService
import com.app.playhvz.firebase.UploadService.Companion.getRewardImageName
import com.app.playhvz.firebase.classmodels.Reward
import com.app.playhvz.firebase.operations.MissionDatabaseOperations
import com.app.playhvz.firebase.operations.RewardDatabaseOperations
import com.app.playhvz.firebase.utils.DataConverterUtil
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.utils.ImageDownloaderUtils
import com.app.playhvz.utils.SystemUtils
import com.google.android.gms.tasks.OnSuccessListener
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.runBlocking

/** Fragment for showing a list of missions.*/
class RewardSettingsFragment : Fragment() {
    companion object {
        private val TAG = RewardSettingsFragment::class.qualifiedName
    }

    private lateinit var descriptionText: EmojiEditText
    private lateinit var button: MaterialButton
    private lateinit var imageView: ImageView
    private lateinit var longNameText: EmojiEditText
    private lateinit var pointText: EditText
    private lateinit var progressBar: ProgressBar
    private lateinit var rewardDraft: Reward
    private lateinit var rewardImageUploadName: String
    private lateinit var shortNameText: EmojiEditText
    private lateinit var toolbarMenu: Menu

    val args: RewardSettingsFragmentArgs by navArgs()
    var gameId: String? = null
    var rewardId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        rewardId = args.rewardId
        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_GAME_ID, null)
        rewardDraft = Reward()
        if (rewardId != null) {
            RewardDatabaseOperations.getRewardDocument(
                gameId!!,
                rewardId!!,
                OnSuccessListener { document ->
                    rewardDraft = DataConverterUtil.convertSnapshotToReward(document)
                    initializeData()
                    enableActions()
                })
        }
        rewardImageUploadName = getRewardImageName()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_reward_settings, container, false)
        imageView = view.findViewById(R.id.reward_badge_image)
        progressBar = view.findViewById(R.id.progress_bar)
        pointText = view.findViewById(R.id.reward_points)
        shortNameText = view.findViewById(R.id.reward_short_name)
        longNameText = view.findViewById(R.id.reward_long_name)
        descriptionText = view.findViewById(R.id.reward_description)
        button = view.findViewById(R.id.submit_button)
        val imageContainer = view.findViewById<ConstraintLayout>(R.id.image_container)
        val badgeContainer = view.findViewById<ConstraintLayout>(R.id.reward_badge_image_container)
        badgeContainer.clipToOutline = true
        badgeContainer.clipChildren = true
        imageView.clipToOutline = true

        pointText.setText(DEFAULT_REWARD_POINT_VALUE.toString())
        imageContainer.setOnClickListener {
            if (rewardDraft == null) {
                return@setOnClickListener
            }
            val photoUrl: String? = rewardDraft.imageUrl
            val photoUploadDialog =
                PhotoUploadDialog(rewardImageUploadName, photoUrl) { uri: Uri? ->
                    updateImageUrl(uri)
                }
            photoUploadDialog.setPositiveButtonCallback {
                progressBar.visibility = View.VISIBLE
            }
            activity?.supportFragmentManager?.let {
                photoUploadDialog.show(it, TAG)
            }
        }
        shortNameText.doOnTextChanged { text, _, _, _ ->
            when {
                text.isNullOrEmpty() || text.isBlank() -> {
                    disableActions()
                }
                else -> {
                    enableActions()
                }
            }
        }
        button.setOnClickListener {
            submitReward()
        }
        setupObservers()
        setupToolbar()
        return view
    }

    override fun onDestroyView() {
        SystemUtils.hideKeyboard(requireContext())
        super.onDestroyView()
    }

    fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        setHasOptionsMenu(true)
        if (toolbar != null) {
            if (rewardId == null) {
                toolbar.title =
                    requireContext().getString(R.string.reward_settings_create_reward_title)
                return
            }
            toolbar.title = requireContext().getString(R.string.reward_settings_edit_reward_title)
            toolbar.setDisplayHomeAsUpEnabled(true)
        }
    }

    override fun onCreateOptionsMenu(menu: Menu, inflater: MenuInflater) {
        inflater.inflate(R.menu.menu_save_settings, menu)
        toolbarMenu = menu
        disableActions()
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == R.id.save_option) {
            submitReward()
        }
        return super.onOptionsItemSelected(item)
    }

    private fun setupObservers() {
        if (gameId == null) {
            return
        }
    }

    private fun initializeData() {
        if (!rewardDraft.imageUrl.isNullOrBlank()) {
            val url = rewardDraft.imageUrl.toString()
            ImageDownloaderUtils.downloadSquareImage(imageView, url)
            rewardImageUploadName = UploadService.parseRewardImageNameFromExistingFirebaseUrl(url)
        }
        rewardDraft.points?.let { pointText.setText(it.toString()) }
        shortNameText.setText(rewardDraft.shortName)
        longNameText.setText(rewardDraft.longName)
        descriptionText.setText(rewardDraft.description)
        button.text = getString(R.string.reward_settings_label_delete_button)
        button.setOnClickListener {
            showDeleteDialog()
        }
    }

    private fun submitReward() {
        disableActions()
        rewardDraft.shortName = shortNameText.text.toString()
        rewardDraft.longName = longNameText.text.toString()
        rewardDraft.description = descriptionText.text.toString()
        val pointText = pointText.text.toString()
        rewardDraft.points =
            if (pointText.isBlank()) DEFAULT_REWARD_POINT_VALUE else Integer.valueOf(pointText)

        if (rewardId == null) {
            runBlocking {
                EspressoIdlingResource.increment()
                RewardDatabaseOperations.asyncCreateReward(
                    gameId!!,
                    rewardDraft,
                    {
                        SystemUtils.showToast(context, "Created reward.")
                        NavigationUtil.navigateToRewardDashboard(findNavController())
                    },
                    {
                        enableActions()
                        SystemUtils.showToast(context, "Couldn't create reward.")
                    }
                )
                EspressoIdlingResource.decrement()
            }
        } else {
            runBlocking {
                EspressoIdlingResource.increment()
                RewardDatabaseOperations.asyncUpdateReward(
                    gameId!!,
                    rewardId!!,
                    rewardDraft,
                    {
                        SystemUtils.showToast(context, "Updated reward!")
                        NavigationUtil.navigateToRewardDashboard(findNavController())
                    },
                    {
                        enableActions()
                        SystemUtils.showToast(context, "Couldn't update reward.")
                    }
                )
                EspressoIdlingResource.decrement()
            }
        }
    }

    private fun showDeleteDialog() {
        disableActions()
        val deleteDialog = ConfirmationDialog(
            getString(R.string.game_settings_delete_dialog_title, rewardDraft.shortName),
            R.string.game_settings_delete_dialog_description,
            R.string.game_settings_delete_dialog_confirmation,
            R.string.button_cancel
        )
        deleteDialog.setPositiveButtonCallback {
            if (rewardId != null) {
                runBlocking {
                    EspressoIdlingResource.increment()
                    MissionDatabaseOperations.asyncDeleteMission(
                        gameId!!,
                        rewardId!!,
                        {
                            SystemUtils.showToast(context, "Deleted mission")
                            NavigationUtil.navigateToMissionDashboard(findNavController())
                            EspressoIdlingResource.decrement()
                        },
                        {
                            enableActions()
                            SystemUtils.showToast(context, "Failed to mission")
                            EspressoIdlingResource.decrement()
                        }
                    )
                }
            }
        }
        deleteDialog.setNegativeButtonCallback {
            enableActions()
        }
        activity?.supportFragmentManager?.let { deleteDialog.show(it, TAG) }
    }

    private fun disableActions() {
        SystemUtils.hideKeyboard(requireContext())
        val menuItem = toolbarMenu.findItem(R.id.save_option)
        menuItem.icon.mutate().alpha = 130
        menuItem.isEnabled = false
        button.isEnabled = false
    }

    private fun enableActions() {
        val menuItem = toolbarMenu.findItem(R.id.save_option)
        menuItem.icon.mutate().alpha = 255
        menuItem.isEnabled = true
        button.isEnabled = true
    }

    private fun updateImageUrl(uri: Uri?) {
        if (uri == null || gameId == null) {
            return
        }
        progressBar.visibility = View.VISIBLE
        ImageDownloaderUtils.downloadSquareImage(imageView, uri.toString())
        rewardDraft.imageUrl = uri.toString()

        /*runBlocking {
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
        }*/
    }
}