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

package com.app.playhvz.screens.chatlist

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.core.widget.doOnTextChanged
import androidx.emoji.widget.EmojiEditText
import androidx.fragment.app.DialogFragment
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.globals.CrossClientConstants.Companion.HUMAN
import com.app.playhvz.common.globals.CrossClientConstants.Companion.ZOMBIE
import com.app.playhvz.firebase.operations.ChatDatabaseOperations
import com.app.playhvz.utils.SystemUtils
import kotlinx.coroutines.runBlocking

class CreateChatDialog(val gameId: String, val playerId: String) : DialogFragment() {
    companion object {
        private val TAG = CreateChatDialog::class.qualifiedName
    }

    private lateinit var allegianceFilterCheckbox: CheckBox
    private lateinit var allegianceHuman: RadioButton
    private lateinit var allegianceZombie: RadioButton
    private lateinit var dialogView: View
    private lateinit var errorLabel: TextView
    private lateinit var inputLabel: TextView
    private lateinit var inputText: EmojiEditText
    private lateinit var negativeButton: Button
    private lateinit var positiveButton: Button
    private lateinit var progressBar: ProgressBar

    private var chatName: String? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        dialogView = inflater.inflate(R.layout.dialog_create_chat, null)
        allegianceFilterCheckbox = dialogView.findViewById(R.id.allegiance_filter_checkbox)
        allegianceHuman = dialogView.findViewById(R.id.radio_human)
        allegianceZombie = dialogView.findViewById(R.id.radio_zombie)
        errorLabel = dialogView.findViewById(R.id.error_label)
        inputLabel = dialogView.findViewById(R.id.dialog_label)
        inputText = dialogView.findViewById(R.id.dialog_input)
        negativeButton = dialogView.findViewById(R.id.negative_button)
        positiveButton = dialogView.findViewById(R.id.positive_button)
        progressBar = dialogView.findViewById(R.id.progress_bar)

        inputText.doOnTextChanged { text, _, _, _ ->
            when {
                text.isNullOrEmpty() -> {
                    positiveButton.isEnabled = false
                }
                else -> {
                    positiveButton.isEnabled = true
                }
            }
            errorLabel.visibility = View.GONE
        }

        initDialogViews()

        return dialogView
    }

    private fun initDialogViews() {
        errorLabel.visibility = View.GONE
        inputLabel.setText(getString(R.string.chat_creation_name_label))
        inputText.setHint(getString(R.string.chat_creation_name_hint))
        positiveButton.setText(getString(R.string.button_create))
        positiveButton.setOnClickListener {
            positiveButton.isEnabled = false
            createChat()
        }
        negativeButton.text = getString(R.string.button_cancel)
        negativeButton.setOnClickListener {
            this.dismiss()
        }
        allegianceFilterCheckbox.setOnClickListener {
            val enableSelection = allegianceFilterCheckbox.isChecked
            allegianceHuman.isEnabled = enableSelection
            allegianceZombie.isEnabled = enableSelection
        }
    }

    private fun createChat() {
        progressBar.visibility = View.VISIBLE
        val chatName = inputText.text.toString()
        val onSuccess = {
            progressBar.visibility = View.INVISIBLE
            dismiss()
            SystemUtils.hideKeyboard(context!!)
            // TODO: open newly created chat room
        }
        val onFailure = {
            progressBar.visibility = View.INVISIBLE
            errorLabel.setText(R.string.join_game_error_label_player)
            errorLabel.visibility = View.VISIBLE
            positiveButton.isEnabled = false
        }
        var allegianceFilter = "none"
        if (allegianceFilterCheckbox.isChecked) {
            allegianceFilter = if (allegianceHuman.isChecked) {
                HUMAN
            } else {
                ZOMBIE
            }
        }
        runBlocking {
            EspressoIdlingResource.increment()
            ChatDatabaseOperations.asyncCreateChatRoom(
                gameId,
                playerId,
                chatName,
                allegianceFilter,
                onSuccess,
                onFailure
            )
            EspressoIdlingResource.decrement()
        }
    }
}