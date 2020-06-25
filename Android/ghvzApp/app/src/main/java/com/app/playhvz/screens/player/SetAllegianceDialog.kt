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

import android.app.AlertDialog
import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.RadioGroup
import androidx.fragment.app.DialogFragment
import com.app.playhvz.R
import com.app.playhvz.common.globals.CrossClientConstants
import com.google.android.material.button.MaterialButton

class SetAllegianceDialog(
    private val currentAllegiance: String,
    private val onUpdate: (allegiance: String) -> Unit
) : DialogFragment() {

    companion object {
        private val TAG = SetAllegianceDialog::class.qualifiedName
    }

    private lateinit var customView: View
    private lateinit var allegianceRadioGroup: RadioGroup

    var onConfirm: ((selectedNumber: Int) -> Unit)? = null

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        customView = requireActivity().layoutInflater.inflate(R.layout.dialog_set_allegiance, null)
        allegianceRadioGroup = customView.findViewById(R.id.radio_button_group)
        when (currentAllegiance) {
            CrossClientConstants.HUMAN -> allegianceRadioGroup.check(R.id.radio_human)
            CrossClientConstants.UNDECLARED -> allegianceRadioGroup.check(R.id.radio_undeclared)
            else -> allegianceRadioGroup.check(R.id.radio_zombie)
        }

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle(R.string.set_allegiance_title)
            .setView(customView)
            .create()

        val positiveButton = customView.findViewById<MaterialButton>(R.id.positive_button)
        positiveButton.setOnClickListener {
            val selectedFilter = allegianceRadioGroup.checkedRadioButtonId

            val allegiance: String = if (selectedFilter == R.id.radio_human) {
                CrossClientConstants.HUMAN
            } else if (selectedFilter == R.id.radio_undeclared) {
                CrossClientConstants.UNDECLARED
            } else {
                CrossClientConstants.ZOMBIE
            }
            onUpdate(allegiance)
            dialog?.dismiss()
        }
        val negativeButton = customView.findViewById<MaterialButton>(R.id.negative_button)
        negativeButton.setOnClickListener {
            dialog?.dismiss()
        }
        return dialog
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Return already inflated custom view
        return customView
    }

    fun setPositiveButtonCallback(okayCallback: (selectedNumber: Int) -> Unit) {
        onConfirm = okayCallback
    }
}