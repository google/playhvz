package com.app.playhvz.screens.gamelist

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.core.widget.doOnTextChanged
import androidx.emoji.widget.EmojiEditText
import androidx.fragment.app.DialogFragment
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.firebase.operations.GameDatabaseOperations
import com.app.playhvz.utils.SystemUtil
import kotlinx.coroutines.runBlocking

class JoinGameDialog : DialogFragment() {
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

    var onOk: (() -> Unit)? = null
    var onCancel: (() -> Unit)? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
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
            if (text.isNullOrEmpty()) {
                positiveButton.setEnabled(false)
            } else {
                positiveButton.setEnabled(true)
            }
            errorLabel.visibility = View.GONE
        }

        initGameScreen()

        return customView
    }

    /* override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
         val dialog = super.onCreateDialog(savedInstanceState)
         // customView = activity!!.layoutInflater.inflate(R.layout.dialog_join_game, null)


         /* val builder = AlertDialog.Builder(context!!)
              .setView(customView)
              .setPositiveButton(android.R.string.ok) { _, _ ->
                  onOk?.invoke()
              }
              .setNegativeButton(android.R.string.cancel) { _, _ ->
                  onCancel?.invoke()
              }
          val dialog = builder.create()
          dialog.window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE)
          */
         return dialog
     }*/

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

    private fun initPlayerScreen() {
        errorLabel.visibility = View.GONE
        inputLabel.setText(getString(R.string.join_game_player_label))
        inputText.text.clear()
        inputText.setHint(getString(R.string.join_game_player_hint))
        positiveButton.setText(getString(R.string.button_submit))
        positiveButton.setOnClickListener {
            checkPlayerValid()
        }
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
            initPlayerScreen()
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
        val onSuccess = {
            progressBar.visibility = View.INVISIBLE
            dismiss()
            SystemUtil.hideKeyboard(context!!)
            Toast.makeText(
                context,
                getString(R.string.join_game_success_message),
                Toast.LENGTH_LONG
            ).show()
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