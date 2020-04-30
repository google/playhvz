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

package com.app.playhvz.common.playersearch

import android.app.Dialog
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
import androidx.lifecycle.Observer
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.app.HvzData
import com.app.playhvz.firebase.classmodels.Group
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.operations.ChatDatabaseOperations
import com.app.playhvz.firebase.operations.GroupDatabaseOperations
import com.app.playhvz.utils.PlayerUtils
import kotlinx.coroutines.runBlocking

class PlayerSearchWithinGroupDialog(val gameId: String, val group: Group?, val onSelectedCallback: (selectedPlayerId: String)->Unit) :
    DialogFragment(),
    PlayerAdapter.PlayerSearchClickHandler {
    companion object {
        private val TAG = PlayerSearchWithinGroupDialog::class.qualifiedName
    }

    private lateinit var dialogView: View
    private lateinit var errorLabel: TextView
    private lateinit var inputLabel: TextView
    private lateinit var inputText: EmojiEditText
    private lateinit var negativeButton: Button
    private lateinit var positiveButton: Button
    private lateinit var playerAdapter: PlayerAdapter
    private lateinit var progressBar: ProgressBar

    private lateinit var playerListLiveData: HvzData<List<Player>>

    private var playerFilter: String? = null
    private var latestQueryFilter: String? = null

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        playerListLiveData = HvzData(listOf())
        return super.onCreateDialog(savedInstanceState)
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        dialogView = inflater.inflate(R.layout.dialog_player_search, null)
        errorLabel = dialogView.findViewById(R.id.error_label)
        inputLabel = dialogView.findViewById(R.id.dialog_label)
        inputText = dialogView.findViewById(R.id.dialog_input)
        negativeButton = dialogView.findViewById(R.id.negative_button)
        positiveButton = dialogView.findViewById(R.id.positive_button)
        progressBar = dialogView.findViewById(R.id.progress_bar)

        playerAdapter = PlayerAdapter(listOf(), requireContext(), this, /* maxSelectable= */ 1)
        val playerRecyclerView: RecyclerView = dialogView.findViewById(R.id.player_list)
        val layoutManager = LinearLayoutManager(context)
        playerRecyclerView.layoutManager = layoutManager
        playerRecyclerView.adapter = playerAdapter

        inputText.doOnTextChanged { text, _, _, _ ->
            when {
                text.isNullOrEmpty() -> {
                    queryPlayers(null)
                }
                else -> {
                    queryPlayers(text.toString())
                }
            }
            errorLabel.visibility = View.GONE
        }

        queryPlayers(null)
        initDialogViews()

        playerListLiveData.observe(this, Observer { updatedList ->
            onPlayerListUpdated(updatedList)
        })

        return dialogView
    }

    override fun onPlayerClicked(anyPlayerSelected: Boolean) {
        positiveButton.isEnabled = anyPlayerSelected
    }

    private fun queryPlayers(nameFilter: String?) {
        if (group == null) {
            return
        }
        latestQueryFilter = nameFilter
        PlayerUtils.getPlayerListInGroup(playerListLiveData, gameId, group, nameFilter)
    }

    private fun onPlayerListUpdated(updatedList: List<Player>) {
        val filteredList = updatedList.toMutableList()
        filteredList.sortBy { player -> player.name }

        val query = latestQueryFilter
        if (!query.isNullOrEmpty()) {
            // Filter out players that don't have the right start to their name.
            for (player in updatedList) {
                if (!player.name!!.startsWith(query, /* ignoreCase= */ true)) {
                    filteredList.remove(player)
                }
            }
        }
        playerAdapter.setData(filteredList)
        playerAdapter.notifyDataSetChanged()
    }

    private fun initDialogViews() {
        errorLabel.visibility = View.GONE
        inputLabel.setText(getString(R.string.player_search_input_label))
        positiveButton.isEnabled = false
        positiveButton.text = getString(R.string.button_set)
        positiveButton.setOnClickListener {
            positiveButton.isEnabled = false
            addSelectedPlayers()
            this.dismiss()
        }
        negativeButton.text = getString(R.string.button_cancel)
        negativeButton.setOnClickListener {
            this.dismiss()
        }
    }

    private fun addSelectedPlayers() {
        progressBar.visibility = View.VISIBLE
        val selectedPlayers = playerAdapter.getSelectedPlayers()
        onSelectedCallback(selectedPlayers.first())
    }
}