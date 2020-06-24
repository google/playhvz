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

package com.app.playhvz.screens.rewards

import android.app.AlertDialog
import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.NumberPicker
import androidx.fragment.app.DialogFragment
import com.app.playhvz.R
import com.google.android.material.button.MaterialButton

class AmountSelectorDialog(
    private val title: String,
    private var confirmationResId: Int? = null,
    private var cancelResId: Int? = null
) : DialogFragment() {

    companion object {
        private val TAG = AmountSelectorDialog::class.qualifiedName
    }

    private lateinit var customView: View
    private lateinit var numberPicker: NumberPicker

    var onConfirm: ((selectedNumber: Int) -> Unit)? = null

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        customView = requireActivity().layoutInflater.inflate(R.layout.dialog_amount_selector, null)
        numberPicker = customView.findViewById(R.id.dialog_number_picker)
        numberPicker.minValue = 1
        numberPicker.maxValue = 400
        numberPicker.value = 10

        if (confirmationResId == null) {
            confirmationResId = R.string.reward_claim_code_dialog_button
        }
        if (cancelResId == null) {
            cancelResId = R.string.button_cancel
        }

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle(title)
            .setView(customView)
            .create()

        val positiveButton = customView.findViewById<MaterialButton>(R.id.positive_button)
        positiveButton.setText(confirmationResId!!)
        positiveButton.setOnClickListener {
            onConfirm?.invoke(numberPicker.value)
            dialog?.dismiss()
        }
        val negativeButton = customView.findViewById<MaterialButton>(R.id.negative_button)
        negativeButton.setText(cancelResId!!)
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