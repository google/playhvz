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

package com.app.playhvz.screens.gamelist

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import androidx.core.widget.doOnTextChanged
import androidx.emoji.widget.EmojiEditText
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.Fragment
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.firebase.operations.GameDatabaseOperations
import com.app.playhvz.utils.GameUtils
import com.app.playhvz.utils.SystemUtils
import kotlinx.coroutines.runBlocking

class JoinGameDialog(private val callingFragment: Fragment) : DialogFragment() {
    companion object {
        private val TAG = JoinGameDialog::class.qualifiedName
    }

    private lateinit var customView: View
    private lateinit var inputLabel: TextView
    private lateinit var inputText: EmojiEditText
    private lateinit var errorLabel: TextView
    private lateinit var negativeButton: Button
    private lateinit var positiveButton: Button
    private lateinit var progressBar: ProgressBar

    private var gameName: String? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        customView = inflater.inflate(R.layout.dialog_join_game, null)

        inputLabel = customView.findViewById(R.id.dialog_label)
        inputText = customView.findViewById(R.id.dialog_input)
        errorLabel = customView.findViewById(R.id.error_label)
        negativeButton = customView.findViewById(R.id.negative_button)
        positiveButton = customView.findViewById(R.id.positive_button)
        progressBar = customView.findViewById(R.id.progress_bar)

        inputText.doOnTextChanged { text, _, _, _ ->
            when {
                text.isNullOrEmpty() -> {
                    positiveButton.isEnabled = false
                }
                text.contains(Regex("\\s")) -> {
                    positiveButton.isEnabled = false
                    errorLabel.setText(R.string.error_whitespace)
                    errorLabel.visibility = View.VISIBLE
                    return@doOnTextChanged
                }
                else -> {
                    positiveButton.isEnabled = true
                }
            }
            errorLabel.visibility = View.GONE
        }

        if (gameName == null) {
            initGameScreen()
        } else {
            initPlayerScreen(/* canGoBack= */ false)
        }

        return customView
    }

    // For use when we don't need to verify if the game exists.
    fun setGameName(gameName: String) {
        this.gameName = gameName
    }

    private fun initGameScreen() {
        inputLabel.setText(getString(R.string.join_game_game_label))
        inputText.setHint(getString(R.string.join_game_game_hint))
        positiveButton.setText(getString(R.string.button_next))
        positiveButton.setOnClickListener {
            positiveButton.setEnabled(false)
            checkGameValidAndUserCanJoin()
        }
        negativeButton.setText(getString(R.string.button_cancel))
        negativeButton.setOnClickListener {
            this.dismiss()
        }
    }

    private fun initPlayerScreen(canGoBack: Boolean) {
        errorLabel.visibility = View.GONE
        inputLabel.setText(getString(R.string.join_game_player_label))
        inputText.text.clear()
        inputText.setHint(getString(R.string.join_game_player_hint))
        positiveButton.setText(getString(R.string.button_submit))
        positiveButton.setOnClickListener {
            checkPlayerValid()
        }
        negativeButton.isEnabled = canGoBack
        negativeButton.setText(getString(R.string.button_back))
        negativeButton.setOnClickListener {
            initGameScreen()
            inputText.setText(gameName)
        }
    }

    private fun checkGameValidAndUserCanJoin() {
        progressBar.visibility = View.VISIBLE
        gameName = inputText.text.toString()
        val onSuccess = {
            progressBar.visibility = View.INVISIBLE
            initPlayerScreen(/* canGoBack= */ true)
        }
        val onFailure = {
            progressBar.visibility = View.INVISIBLE
            errorLabel.setText(R.string.join_game_error_label_game)
            errorLabel.visibility = View.VISIBLE
        }
        runBlocking {
            EspressoIdlingResource.increment()
            GameDatabaseOperations.asyncCheckGameExistsAndPlayerCanJoin(
                gameName!!,
                onSuccess,
                onFailure
            )
            EspressoIdlingResource.decrement()
        }
    }

    private fun checkPlayerValid() {
        progressBar.visibility = View.VISIBLE
        val playerName = inputText.text.toString()
        val onSuccess = { gameId: String ->
            progressBar.visibility = View.INVISIBLE
            dismiss()
            SystemUtils.hideKeyboard(context!!)
            SystemUtils.showToast(context, getString(R.string.join_game_success_message))
            GameUtils.openGameDashboard(callingFragment, gameId)
        }
        val onFailure = {
            progressBar.visibility = View.INVISIBLE
            errorLabel.setText(R.string.join_game_error_label_player)
            errorLabel.visibility = View.VISIBLE
            positiveButton.setEnabled(false)
        }
        runBlocking {
            EspressoIdlingResource.increment()
            GameDatabaseOperations.asyncTryToJoinGame(
                gameName!!,
                playerName,
                onSuccess,
                onFailure
            )
            EspressoIdlingResource.decrement()
        }
    }
}