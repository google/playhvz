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

package com.app.playhvz.screens.rules

import android.os.Bundle
import android.view.*
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.ActionBar
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.app.playhvz.R
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.google.android.material.floatingactionbutton.FloatingActionButton


class RulesFragment : Fragment() {

    private var gameId: String? = null
    private var fab: FloatingActionButton? = null
    private var isEditing: Boolean = false

    private lateinit var gameViewModel: GameViewModel
    private lateinit var interceptBackCallback: OnBackPressedCallback
    private lateinit var progressBar: ProgressBar
    private lateinit var toolbar: ActionBar
    private lateinit var toolbarMenu: Menu

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        toolbar = (activity as AppCompatActivity).supportActionBar!!
        gameViewModel = GameViewModel()

        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_GAME_ID, null)
        if (gameId == null) {
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
        }

        setupToolbar()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_rules, container, false)
        fab = activity?.findViewById(R.id.floating_action_button)
        progressBar = view.findViewById(R.id.progress_bar)

        setupObservers()
        return view
    }

    override fun onCreateOptionsMenu(menu: Menu, inflater: MenuInflater) {
        inflater.inflate(R.menu.menu_save_settings, menu)
        toolbarMenu = menu
        setupFab()
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.save_option -> {
                exitEditMode()
                return true
            }
        }
        return super.onOptionsItemSelected(item)
    }

    fun setupToolbar() {
        toolbar.title = getString(R.string.navigation_drawer_rules)
        toolbar.setDisplayHomeAsUpEnabled(false)
        setHasOptionsMenu(true)
    }

    private fun setupObservers() {
        if (gameId.isNullOrEmpty()) {
            return
        }
        gameViewModel.getGame(gameId!!) {
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
        }.observe(viewLifecycleOwner, androidx.lifecycle.Observer { serverGame: Game ->
            updateGame(serverGame)
        })
    }

    private fun setupFab() {
        fab?.visibility = View.VISIBLE
        fab?.setOnClickListener {
            if (isEditing) {
                exitEditMode()
            } else {
                enterEditMode()
            }
        }
        exitEditMode()
    }

    private fun hideProgressBar() {
        if (this.view == null) {
            return
        }
        progressBar.visibility = View.GONE
    }

    private fun updateGame(serverGame: Game) {
        hideProgressBar()
    }

    private fun hideActionBarActions() {
        val menuItem = toolbarMenu.findItem(R.id.save_option)
        menuItem.isVisible = false
    }

    private fun showActionBarActions() {
        val menuItem = toolbarMenu.findItem(R.id.save_option)
        menuItem.isVisible = true
    }

    private fun enterEditMode() {
        if (isEditing) {
            return
        }
        isEditing = true
        fab?.setImageDrawable(ContextCompat.getDrawable(requireContext(), R.drawable.ic_x))
        showActionBarActions()
    }

    private fun exitEditMode() {
        hideActionBarActions()
        fab?.setImageDrawable(ContextCompat.getDrawable(requireContext(), R.drawable.ic_edit))
        isEditing = false
    }
}