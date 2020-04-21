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

package com.app.playhvz.common

import android.app.AlertDialog
import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.DialogFragment
import com.app.playhvz.R
import com.google.android.material.button.MaterialButton

class ConfirmationDialog(
    private val title: String,
    private val descriptionResId: Int? = null,
    private var confirmationResId: Int? = null,
    private var cancelResId: Int? = null
) : DialogFragment() {

    companion object {
        private val TAG = ConfirmationDialog::class.qualifiedName
    }

    private lateinit var customView: View
    var onConfirm: (() -> Unit)? = null
    var onCancel: (() -> Unit)? = null

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        customView = requireActivity().layoutInflater.inflate(R.layout.dialog_confirmation, null)
        val descriptionTextView = customView.findViewById<TextView>(R.id.dialog_description)

        if (descriptionResId == null) {
            descriptionTextView.visibility = View.GONE
        } else {
            descriptionTextView.text = getString(descriptionResId)
        }

        if (confirmationResId == null) {
            confirmationResId = android.R.string.ok
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
            onConfirm?.invoke()
            dialog?.dismiss()
        }
        val negativeButton = customView.findViewById<MaterialButton>(R.id.negative_button)
        negativeButton.setText(cancelResId!!)
        negativeButton.setOnClickListener {
            onCancel?.invoke()
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

    fun setPositiveButtonCallback(okayCallback: () -> Unit) {
        onConfirm = okayCallback
    }

    fun setNegativeButtonCallback(negativeCallback: () -> Unit) {
        onCancel = negativeCallback
    }
}