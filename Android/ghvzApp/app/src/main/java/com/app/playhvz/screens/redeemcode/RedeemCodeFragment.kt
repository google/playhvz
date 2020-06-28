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

package com.app.playhvz.screens.redeemcode

import android.os.Bundle
import android.view.LayoutInflater
import android.view.Menu
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.ActionBar
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doOnTextChanged
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.common.globals.SharedPreferencesConstants
import com.app.playhvz.firebase.operations.PlayerDatabaseOperations
import com.app.playhvz.firebase.operations.RewardDatabaseOperations
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.navigation.NavigationUtil
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.runBlocking

class RedeemCodeFragment : Fragment() {
    companion object {
        private val TAG = RedeemCodeFragment::class.qualifiedName
    }

    enum class RedeemCodeFragmentType {
        LIFECODE,
        REWARDCODE
    }

    private var gameId: String? = null
    private var playerId: String? = null

    private val args: RedeemCodeFragmentArgs by navArgs()

    private lateinit var codeInput: EditText
    private lateinit var errorLabel: TextView
    private lateinit var fragmentType: RedeemCodeFragmentType
    private lateinit var gameViewModel: GameViewModel
    private lateinit var progressBar: ProgressBar
    lateinit var submitButton: MaterialButton
    private lateinit var toolbar: ActionBar
    private lateinit var toolbarMenu: Menu

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        fragmentType = args.fragmentType
        toolbar = (activity as AppCompatActivity).supportActionBar!!
        gameViewModel = GameViewModel()

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
        val view = inflater.inflate(R.layout.fragment_redeem_code, container, false)
        progressBar = view.findViewById(R.id.progress_bar)
        codeInput = view.findViewById(R.id.code_input)
        submitButton = view.findViewById(R.id.send_button)
        errorLabel = view.findViewById(R.id.error_label)

        codeInput.hint =
            if (fragmentType == RedeemCodeFragmentType.LIFECODE)
                resources.getString(R.string.infect_card_hint_text)
            else
                resources.getString(R.string.reward_claim_code_hint)
        codeInput.doOnTextChanged { text, _, _, _ ->
            errorLabel.visibility = View.GONE
            when {
                text.isNullOrEmpty() || text.isBlank() -> {
                    submitButton.isEnabled = false
                }
                else -> {
                    submitButton.isEnabled = true
                }
            }
        }

        val onSuccess = {
            progressBar.visibility = View.GONE
            codeInput.text.clear()
            EspressoIdlingResource.decrement()
            submitButton.isEnabled = true
        }
        val onFail = {
            EspressoIdlingResource.decrement()
            submitButton.isEnabled = true
            errorLabel.visibility = View.VISIBLE
            progressBar.visibility = View.GONE
        }
        submitButton.setOnClickListener {
            submitButton.isEnabled = false
            progressBar.visibility = View.VISIBLE
            runBlocking {
                EspressoIdlingResource.increment()
                if (fragmentType == RedeemCodeFragmentType.LIFECODE) {
                    PlayerDatabaseOperations.infectPlayerByLifeCode(
                        gameId!!,
                        playerId!!,
                        codeInput.text.toString(),
                        onSuccess,
                        onFail
                    )
                } else {
                    RewardDatabaseOperations.redeemClaimCode(
                        gameId!!,
                        playerId!!,
                        codeInput.text.toString(),
                        onSuccess,
                        onFail
                    )
                }
            }
        }
        return view
    }

    fun setupToolbar() {
        toolbar.title = if (fragmentType == RedeemCodeFragmentType.LIFECODE) {
            getString(R.string.infect_card_title)
        } else {
            getString(R.string.navigation_drawer_redeem_reward)
        }
    }

}