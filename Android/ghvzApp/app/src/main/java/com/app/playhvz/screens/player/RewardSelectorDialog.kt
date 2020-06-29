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

package com.app.playhvz.screens.player

import android.app.AlertDialog
import android.app.Dialog
import android.content.res.Resources
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.DialogFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.firebase.operations.RewardDatabaseOperations
import com.app.playhvz.utils.SystemUtils
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.runBlocking

class RewardSelectorDialog(
    private val gameId: String,
    private val playerId: String
) : DialogFragment() {

    companion object {
        private val TAG = RewardSelectorDialog::class.qualifiedName
    }

    private lateinit var customView: View
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: Adapter
    private lateinit var loadingSpinner: ProgressBar

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        customView = requireActivity().layoutInflater.inflate(R.layout.dialog_reward_selector, null)
        loadingSpinner = customView.findViewById(R.id.spinner)
        recyclerView = customView.findViewById(R.id.recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(context)

        val onRewardSelected = Unit@{ shortName: String ->
            if (shortName.isEmpty()) {
                return@Unit
            }
            loadingSpinner.visibility = View.VISIBLE
            val claimCode = shortName + "-" + playerId + "-" + System.currentTimeMillis()
            runBlocking {
                EspressoIdlingResource.increment()
                RewardDatabaseOperations.redeemClaimCode(
                    gameId,
                    playerId,
                    claimCode,
                    {
                        loadingSpinner.visibility = View.GONE
                        SystemUtils.showToast(requireContext(), "Reward given!")
                        EspressoIdlingResource.decrement()
                        dismiss()
                    },
                    {
                        loadingSpinner.visibility = View.GONE
                        SystemUtils.showToast(requireContext(), "Failed to give reward")
                        EspressoIdlingResource.decrement()
                    }
                )
            }
        }

        adapter = Adapter(resources, onRewardSelected)
        recyclerView.adapter = adapter


        val cancelResId = R.string.button_cancel
        val dialog = AlertDialog.Builder(requireContext())
            .setTitle(resources.getString(R.string.player_profile_admin_options_reward))
            .setView(customView)
            .create()

        val positiveButton = customView.findViewById<MaterialButton>(R.id.positive_button)
        positiveButton.setText(R.string.button_submit)
        positiveButton.setOnClickListener {
            dialog?.dismiss()
        }
        positiveButton.visibility = View.GONE
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

        val onLoaded = { rewards: Map<String, String> ->
            adapter.setData(rewards)
            loadingSpinner.visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
            recyclerView.invalidate()
        }
        runBlocking {
            EspressoIdlingResource.increment()
            RewardDatabaseOperations.asyncGetRewardsByName(gameId, onLoaded, {
                SystemUtils.showToast(recyclerView.context, "Couldn't load rewards.")
            })
            EspressoIdlingResource.decrement()
        }
        // Return already inflated custom view
        return customView
    }

    class Adapter(
        private val resources: Resources,
        private val onClick: (rewardId: String) -> Unit
    ) :
        RecyclerView.Adapter<RecyclerView.ViewHolder>() {

        var items: Map<String, String> = mapOf()

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
            return ViewHolder(
                LayoutInflater.from(parent.context).inflate(
                    R.layout.list_item_clickable_text,
                    parent,
                    false
                ),
                onClick
            )
        }

        override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
            val shortName = items.keys.toList()[position]
            (holder as ViewHolder).onBind(shortName, items[shortName])
        }

        override fun getItemCount(): Int {
            return items.size
        }

        fun setData(data: Map<String, String>) {
            if (data.isEmpty()) {
                items = mapOf(Pair(resources.getString(R.string.reward_claim_code_dialog_none), ""))
                return
            }
            items = data
        }
    }

    class ViewHolder(view: View, private val onClick: (shortName: String) -> Unit) :
        RecyclerView.ViewHolder(view) {
        private val textView = view.findViewById<TextView>(R.id.text)!!

        fun onBind(shortName: String, rewardId: String?) {
            textView.text = shortName
            if (rewardId.isNullOrBlank()) {
                itemView.setOnClickListener(null)
                return
            }
            itemView.setOnClickListener {
                onClick.invoke(shortName)
            }
        }
    }
}