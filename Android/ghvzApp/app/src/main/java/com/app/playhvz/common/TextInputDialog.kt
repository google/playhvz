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
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.EditText
import androidx.fragment.app.DialogFragment
import com.app.playhvz.R

class TextInputDialog(title: String? = null, hint: String? = null, draftText: String? = null, isMultiline: Boolean = false) : DialogFragment() {

    companion object {
        private val TAG = TextInputDialog::class.qualifiedName
    }

    private var title: String? = null
    private var draftText: String? = null
    private var hintText: String? = null
    private var supportsMultiline = false

    private lateinit var customView: View
    lateinit var editText: EditText
    var onOk: (() -> Unit)? = null
    var onCancel: (() -> Unit)? = null

    init {
        this.title = title
        this.hintText = hint
        this.draftText = draftText
        this.supportsMultiline = isMultiline
    }

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        customView = requireActivity().layoutInflater.inflate(R.layout.dialog_text_input, null)

        editText = customView.findViewById(R.id.editText)
        editText.hint = hintText

        if (supportsMultiline) {
            editText.minLines = 3
            editText.inputType = InputType.TYPE_TEXT_FLAG_MULTI_LINE or InputType.TYPE_TEXT_FLAG_CAP_SENTENCES or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
        }

        if (draftText != null) {
            editText.append(draftText)
        }

        val builder = AlertDialog.Builder(requireContext())
            .setTitle(title)
            .setView(customView)
            .setPositiveButton(android.R.string.ok) { _, _ ->
                onOk?.invoke()
            }
            .setNegativeButton(android.R.string.cancel) { _, _ ->
                onCancel?.invoke()
            }
        val dialog = builder.create()
        dialog.window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE)
        return dialog
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?,
                              savedInstanceState: Bundle?): View? {
        // Return already inflated custom view
        return customView
    }

    fun setPositiveButtonCallback(okayCallback: () -> Unit) {
        onOk = okayCallback
    }

    fun setNegativeButtonCallback(negativeCallback: () -> Unit) {
        onCancel = negativeCallback
    }

    fun getNameProposal(): String {
        return editText.text.toString()
    }
}