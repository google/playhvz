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

package com.app.playhvz.screens.missions.missionsettings

import android.os.Bundle
import android.view.*
import android.widget.RadioGroup
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doOnTextChanged
import androidx.emoji.widget.EmojiEditText
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.ConfirmationDialog
import com.app.playhvz.common.DateTimePickerDialog
import com.app.playhvz.common.globals.CrossClientConstants.Companion.BLANK_ALLEGIANCE_FILTER
import com.app.playhvz.common.globals.CrossClientConstants.Companion.HUMAN
import com.app.playhvz.common.globals.CrossClientConstants.Companion.UNDECLARED
import com.app.playhvz.common.globals.CrossClientConstants.Companion.ZOMBIE
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Mission
import com.app.playhvz.firebase.operations.MissionDatabaseOperations
import com.app.playhvz.firebase.utils.DataConverterUtil
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.utils.SystemUtils
import com.app.playhvz.utils.TimeUtils
import com.google.android.gms.tasks.OnSuccessListener
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.runBlocking

/** Fragment for showing a list of missions.*/
class MissionSettingsFragment : Fragment() {
    companion object {
        private val TAG = MissionSettingsFragment::class.qualifiedName
    }

    private lateinit var nameText: EmojiEditText
    private lateinit var detailText: EmojiEditText
    private lateinit var submitButton: MaterialButton
    private lateinit var startTime: TextView
    private lateinit var endTime: TextView
    private lateinit var missionDraft: Mission
    private lateinit var allegianceRadioGroup: RadioGroup
    private lateinit var toolbarMenu: Menu

    val args: MissionSettingsFragmentArgs by navArgs()
    var gameId: String? = null
    var missionId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        missionId = args.missionId
        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_GAME_ID, null)
        missionDraft = Mission()
        if (missionId != null) {
            MissionDatabaseOperations.getMissionDocument(
                gameId!!,
                missionId!!,
                OnSuccessListener { document ->
                    missionDraft = DataConverterUtil.convertSnapshotToMission(document)
                    initializeData()
                    enableActions()
                })
        }
        setupObservers()
        setupToolbar()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_mission_settings, container, false)
        nameText = view.findViewById(R.id.mission_name)
        detailText = view.findViewById(R.id.mission_details)
        submitButton = view.findViewById(R.id.submit_button)
        startTime = view.findViewById(R.id.start_time)
        endTime = view.findViewById(R.id.end_time)
        allegianceRadioGroup = view.findViewById(R.id.radio_button_group)

        submitButton.setOnClickListener {
            submitMission()
        }
        nameText.doOnTextChanged { text, _, _, _ ->
            when {
                text.isNullOrEmpty() || text.isBlank() -> {
                    disableActions()
                }
                else -> {
                    enableActions()
                }
            }
        }
        startTime.setOnClickListener { v ->
            openTimePicker(v as TextView)
        }
        endTime.setOnClickListener { v ->
            openTimePicker(v as TextView)
        }

        setupAllegianceButtons()
        return view
    }

    override fun onDestroyView() {
        SystemUtils.hideKeyboard(requireView())
        super.onDestroyView()
    }

    fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        setHasOptionsMenu(true)
        if (toolbar != null) {
            if (missionId == null) {
                toolbar.title =
                    requireContext().getString(R.string.mission_settings_create_mission_title)
                return
            }
            toolbar.title = requireContext().getString(R.string.mission_settings_title)
        }
    }

    override fun onCreateOptionsMenu(menu: Menu, inflater: MenuInflater) {
        inflater.inflate(R.menu.menu_save_settings, menu)
        toolbarMenu = menu
        disableActions()
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == R.id.save_option) {
            submitMission()
        }
        return super.onOptionsItemSelected(item)
    }

    override fun onPause() {
        super.onPause()
        SystemUtils.hideKeyboard(requireView())
    }

    private fun setupObservers() {
        if (gameId == null) {
            return
        }
    }

    private fun setupAllegianceButtons() {
        if (missionId != null) {
            allegianceRadioGroup.isEnabled = false
        }
    }

    private fun initializeData() {
        nameText.setText(missionDraft.name)
        detailText.setText(missionDraft.details)
        startTime.text = TimeUtils.getFormattedTime(missionDraft.startTime, /* singleLine= */ false)
        endTime.text = TimeUtils.getFormattedTime(missionDraft.endTime, /* singleLine= */ false)
        when (missionDraft.allegianceFilter) {
            HUMAN -> allegianceRadioGroup.check(R.id.radio_human)
            ZOMBIE -> allegianceRadioGroup.check(R.id.radio_zombie)
            UNDECLARED -> allegianceRadioGroup.check(R.id.radio_undeclared)
            else -> allegianceRadioGroup.check(R.id.radio_everyone)
        }
        submitButton.text = getString(R.string.mission_settings_delete)
        submitButton.setOnClickListener {
            showDeleteDialog()
        }
    }

    private fun submitMission() {
        disableActions()
        val name: String = nameText.text.toString()
        val details: String = detailText.text.toString()

        val selectedFilter = allegianceRadioGroup.checkedRadioButtonId

        val allegianceFilter: String = if (selectedFilter == R.id.radio_human) {
            HUMAN
        } else if (selectedFilter == R.id.radio_zombie) {
            ZOMBIE
        } else if (selectedFilter == R.id.radio_undeclared) {
            UNDECLARED
        } else {
            BLANK_ALLEGIANCE_FILTER
        }

        if (missionId == null) {
            runBlocking {
                EspressoIdlingResource.increment()
                MissionDatabaseOperations.asyncCreateMission(
                    gameId!!,
                    name,
                    details,
                    missionDraft.startTime,
                    missionDraft.endTime,
                    allegianceFilter,
                    {
                        SystemUtils.showToast(context, "Created mission.")
                        NavigationUtil.navigateToMissionDashboard(findNavController())
                    },
                    {
                        enableActions()
                        SystemUtils.showToast(context, "Couldn't create mission.")
                    }
                )
                EspressoIdlingResource.decrement()
            }
        } else {
            runBlocking {
                EspressoIdlingResource.increment()
                MissionDatabaseOperations.asyncUpdateMission(
                    gameId!!,
                    missionId!!,
                    name,
                    details,
                    missionDraft.startTime,
                    missionDraft.endTime,
                    allegianceFilter,
                    {
                        SystemUtils.showToast(context, "Updated mission.")
                        NavigationUtil.navigateToMissionDashboard(findNavController())
                    },
                    {
                        enableActions()
                        SystemUtils.showToast(context, "Couldn't update mission.")
                    }
                )
                EspressoIdlingResource.decrement()
            }
        }
    }

    private fun openTimePicker(clickedView: TextView) {
        val dateTimeDialog = DateTimePickerDialog { timestamp ->
            clickedView.text = TimeUtils.getFormattedTime(timestamp, /* singleLine= */ false)
            if (clickedView.tag == getString(R.string.settings_start_time_tag)) {
                missionDraft.startTime = timestamp
            } else {
                missionDraft.endTime = timestamp
            }
        }
        if (clickedView.tag == getString(R.string.settings_start_time_tag)) {
            if (missionDraft.startTime != Mission.EMPTY_TIMESTAMP) {
                dateTimeDialog.setDateTime(missionDraft.startTime)
            }
        } else {
            if (missionDraft.endTime != Mission.EMPTY_TIMESTAMP) {
                dateTimeDialog.setDateTime(missionDraft.endTime)
            }
        }
        activity?.supportFragmentManager?.let { dateTimeDialog.show(it, TAG) }
    }

    private fun showDeleteDialog() {
        disableActions()
        val deleteDialog = ConfirmationDialog(
            getString(R.string.game_settings_delete_dialog_title, missionDraft.name),
            R.string.game_settings_delete_dialog_description,
            R.string.game_settings_delete_dialog_confirmation,
            R.string.button_cancel
        )
        deleteDialog.setPositiveButtonCallback {
            if (missionId != null) {
                runBlocking {
                    EspressoIdlingResource.increment()
                    MissionDatabaseOperations.asyncDeleteMission(
                        gameId!!,
                        missionId!!,
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
        SystemUtils.hideKeyboard(requireView())
        val menuItem = toolbarMenu.findItem(R.id.save_option)
        menuItem.icon.mutate().alpha = 130
        menuItem.isEnabled = false
        submitButton.isEnabled = false
    }

    private fun enableActions() {
        val menuItem = toolbarMenu.findItem(R.id.save_option)
        menuItem.icon.mutate().alpha = 255
        menuItem.isEnabled = true
        submitButton.isEnabled = true
    }
}