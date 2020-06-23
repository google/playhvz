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

package com.app.playhvz.screens.rules_faq

import android.os.Bundle
import android.view.*
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.ActionBar
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.ConfirmationDialog
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.operations.GameDatabaseOperations
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.app.playhvz.utils.SystemUtils
import com.google.android.material.floatingactionbutton.FloatingActionButton
import kotlinx.coroutines.runBlocking


class CollapsibleListFragment : Fragment() {
    companion object {
        private val TAG = CollapsibleListFragment::class.qualifiedName
    }

    enum class CollapsibleFragmentType {
        RULES,
        FAQ
    }

    private val args: CollapsibleListFragmentArgs by navArgs()

    private var gameId: String? = null
    private var playerId: String? = null
    private var isAdmin: Boolean = false
    private var game: Game? = null
    private var currentCollapsibleSections: MutableList<Game.CollapsibleSection> = mutableListOf()
    private var isEditing: Boolean = false
    private var isSaving: Boolean = false
    private var editAdapter: EditCollapsibleSectionAdapter? = null

    private lateinit var fragmentType: CollapsibleFragmentType
    private lateinit var fab: FloatingActionButton
    private lateinit var gameViewModel: GameViewModel
    private lateinit var progressBar: ProgressBar
    private lateinit var toolbar: ActionBar
    private lateinit var toolbarMenu: Menu
    private lateinit var displayAdapter: DisplayCollapsibleSectionAdapter
    private lateinit var rulesList: RecyclerView
    private lateinit var errorLabel: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        fragmentType = args.fragmentType
        toolbar = (activity as AppCompatActivity).supportActionBar!!
        gameViewModel = GameViewModel()
        displayAdapter = DisplayCollapsibleSectionAdapter(listOf(), requireContext())

        val sharedPrefs = activity?.getSharedPreferences(
            SharedPreferencesConstants.PREFS_FILENAME,
            0
        )!!
        gameId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_GAME_ID, null)
        playerId = sharedPrefs.getString(SharedPreferencesConstants.CURRENT_PLAYER_ID, null)
        if (gameId == null || playerId == null) {
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
        }

        setupToolbar()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_collapsible_list, container, false)
        fab = requireActivity().findViewById(R.id.floating_action_button)
        progressBar = view.findViewById(R.id.progress_bar)
        errorLabel = view.findViewById(R.id.error_label)
        rulesList = view.findViewById(R.id.collapsible_item_list)
        rulesList.layoutManager = LinearLayoutManager(context)
        rulesList.adapter = displayAdapter

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
                saveChanges()
                return true
            }
        }
        return super.onOptionsItemSelected(item)
    }

    fun setupToolbar() {
        toolbar.title = if (fragmentType == CollapsibleFragmentType.RULES) {
            getString(R.string.navigation_drawer_rules)
        } else {
            getString(R.string.navigation_drawer_faq)
        }
        toolbar.setDisplayHomeAsUpEnabled(true)
        setHasOptionsMenu(true)
    }

    private fun setupObservers() {
        if (gameId.isNullOrEmpty() || playerId == null) {
            return
        }

        val onFailure = {
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
        }
        gameViewModel.getGameAndAdminObserver(this, gameId!!, playerId!!, onFailure)
            .observe(
                viewLifecycleOwner,
                androidx.lifecycle.Observer { serverUpdate: GameViewModel.GameWithAdminStatus ->
                    updateGame(serverUpdate)
                })
    }

    private fun setupFab() {
        fab.visibility = View.GONE
        fab.setOnClickListener {
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
        fab.setImageDrawable(ContextCompat.getDrawable(requireContext(), R.drawable.ic_x))
        showActionBarActions()
        val dataList = if (fragmentType == CollapsibleFragmentType.RULES) {
            game!!.rules
        } else {
            game!!.faq
        }
        currentCollapsibleSections = dataList.toMutableList()
        editAdapter?.setData(dataList)
        rulesList.adapter = editAdapter
    }

    private fun exitEditMode() {
        hideActionBarActions()
        fab.setImageDrawable(ContextCompat.getDrawable(requireContext(), R.drawable.ic_edit))
        isEditing = false
        rulesList.adapter = displayAdapter
        updateUi()
    }

    private fun updateGame(serverUpdate: GameViewModel.GameWithAdminStatus?) {
        hideProgressBar()
        if (serverUpdate == null) {
            NavigationUtil.navigateToGameList(findNavController(), requireActivity())
        }
        isAdmin = serverUpdate!!.isAdmin
        game = serverUpdate.game
        if (isSaving) {
            return
        }
        if (isEditing) {
            errorLabel.visibility = View.VISIBLE
            toolbarMenu.findItem(R.id.save_option).isEnabled = false
            return
        } else if (errorLabel.visibility == View.VISIBLE) {
            errorLabel.visibility = View.GONE
        }
        updateUi()
    }

    private fun updateUi() {
        if (game == null) {
            displayAdapter.setData(listOf())
            displayAdapter.notifyDataSetChanged()
            return
        }
        if (isAdmin) {
            fab.visibility = View.VISIBLE
            val onSectionAdded = {
                val newSection = Game.CollapsibleSection()
                newSection.order = currentCollapsibleSections.size
                currentCollapsibleSections.add(newSection)
                editAdapter?.setData(currentCollapsibleSections)
                editAdapter?.notifyDataSetChanged()
            }
            val onSectionDeleted = { position: Int ->
                val confirmationDialog = ConfirmationDialog(
                    getString(R.string.collapsible_section_remove_dialog_title),
                    R.string.collapsible_section_remove_dialog_content,
                    R.string.delete_button_content_description
                )
                confirmationDialog.setPositiveButtonCallback {
                    currentCollapsibleSections.removeAt(position)
                    editAdapter?.setData(currentCollapsibleSections)
                    editAdapter?.notifyDataSetChanged()
                }
                activity?.supportFragmentManager?.let { confirmationDialog.show(it, TAG) }
            }
            if (editAdapter == null) {
                editAdapter =
                    EditCollapsibleSectionAdapter(listOf(), this, onSectionAdded, onSectionDeleted)

            }
        } else if (fab.visibility == View.VISIBLE) {
            fab.visibility = View.GONE
        }
        val dataList = if (fragmentType == CollapsibleFragmentType.RULES) {
            game!!.rules
        } else {
            game!!.faq
        }
        displayAdapter.setData(dataList)
        displayAdapter.notifyDataSetChanged()
    }

    private fun saveChanges() {
        if (game == null) {
            return
        }
        isSaving = true
        disableActions()

        if (fragmentType == CollapsibleFragmentType.RULES) {
            game?.rules = editAdapter!!.getLatestData()
        }
        if (fragmentType == CollapsibleFragmentType.FAQ) {
            game?.faq = editAdapter!!.getLatestData()
        }
        val onSuccess = {
            isSaving = false
            exitEditMode()
            enableActions()
            updateUi()
        }
        runBlocking {
            EspressoIdlingResource.increment()
            GameDatabaseOperations.asyncUpdateGame(
                game!!,
                onSuccess,
                {
                    isSaving = false
                    enableActions()
                    SystemUtils.showToast(context, "Couldn't save changes.")
                }
            )
            EspressoIdlingResource.decrement()
        }
    }

    private fun disableActions() {
        SystemUtils.hideKeyboard(requireContext())
        progressBar.visibility = View.VISIBLE
        val menuItem = toolbarMenu.findItem(R.id.save_option)
        menuItem.icon.mutate().alpha = 130
        menuItem.isEnabled = false
        fab.isEnabled = false
    }

    private fun enableActions() {
        progressBar.visibility = View.GONE
        val menuItem = toolbarMenu.findItem(R.id.save_option)
        menuItem.icon.mutate().alpha = 255
        menuItem.isEnabled = true
        fab.isEnabled = true
    }
}