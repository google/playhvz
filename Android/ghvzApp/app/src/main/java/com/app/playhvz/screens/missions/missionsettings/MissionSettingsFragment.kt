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
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doOnTextChanged
import androidx.emoji.widget.EmojiEditText
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.navArgs
import com.app.playhvz.R
import com.app.playhvz.common.DateTimePickerDialog
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Mission
import com.google.android.material.button.MaterialButton
import java.text.SimpleDateFormat

/** Fragment for showing a list of missions.*/
class MissionSettingsFragment : Fragment() {
    companion object {
        private val TAG = MissionSettingsFragment::class.qualifiedName
    }

    lateinit var nameText: EmojiEditText
    lateinit var submitButton: MaterialButton
    lateinit var startTime: TextView
    lateinit var endTime: TextView

    val args: MissionSettingsFragmentArgs by navArgs()
    var gameId: String? = null
    var missionId: String? = null
    var missionDraft: Mission? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        missionId = args.missionId
        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_GAME_ID, null)
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
        submitButton = view.findViewById(R.id.submit_button)
        startTime = view.findViewById(R.id.mission_start_time)
        endTime = view.findViewById(R.id.mission_end_time)
        submitButton.setOnClickListener {
            submitMission()
        }
        nameText.doOnTextChanged { text, start, count, after ->
            when {
                text.isNullOrEmpty() || text.isBlank() -> {
                    submitButton.isEnabled = false
                }
                else -> {
                    submitButton.isEnabled = true
                }
            }
        }
        startTime.setOnClickListener { v ->
            openTimePicker(v as TextView)
        }
        endTime.setOnClickListener { v ->
            openTimePicker(v as TextView)
        }
        return view
    }

    fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        if (toolbar != null) {
            if (missionId == null) {
                toolbar.title = context!!.getString(R.string.mission_settings_create_mission_title)
                return
            }
            toolbar.title = context!!.getString(R.string.mission_settings_title)
            toolbar.setDisplayHomeAsUpEnabled(false)
        }
    }

    private fun setupObservers() {
        if (gameId == null) {
            return
        }
    }

    private fun submitMission() {
        val name = nameText.text
    }

    private fun openTimePicker(clickedView: TextView) {
        val dateTimeDialog = DateTimePickerDialog { timestamp ->
            val dateTimeFormatter = SimpleDateFormat.getDateTimeInstance()
            clickedView.text = dateTimeFormatter.format(timestamp)
        }
        activity?.supportFragmentManager?.let { dateTimeDialog.show(it, TAG) }
    }
}