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

package com.app.playhvz.screens.rewards

import android.app.AlertDialog
import android.app.Dialog
import android.content.res.Resources
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import androidx.emoji.widget.EmojiTextView
import androidx.fragment.app.DialogFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.firebase.operations.RewardDatabaseOperations
import com.app.playhvz.utils.SystemUtils
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.runBlocking

class ClaimCodeViewerDialog(
    private val gameId: String,
    private val rewardId: String,
    private val title: String
) : DialogFragment() {

    companion object {
        private val TAG = ClaimCodeViewerDialog::class.qualifiedName
    }

    private lateinit var customView: View
    private lateinit var loadingSpinner: ProgressBar
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: Adapter

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        customView =
            requireActivity().layoutInflater.inflate(R.layout.dialog_claim_code_viewer, null)
        loadingSpinner = customView.findViewById(R.id.spinner)
        recyclerView = customView.findViewById(R.id.recycler_view)
        adapter = Adapter(recyclerView.resources)
        recyclerView.layoutManager = LinearLayoutManager(context)
        recyclerView.adapter = adapter

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle(title)
            .setView(customView)
            .create()

        val negativeButton = customView.findViewById<MaterialButton>(R.id.negative_button)
        negativeButton.setOnClickListener {
            dialog?.dismiss()
        }
        return dialog
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val onLoaded = { claimCodes: Array<String> ->
            adapter.setData(claimCodes.toList())
            loadingSpinner.visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
            recyclerView.invalidate()
        }
        runBlocking {
            EspressoIdlingResource.increment()
            RewardDatabaseOperations.asyncGetAvailableClaimCodes(gameId, rewardId, onLoaded, {
                SystemUtils.showToast(recyclerView.context, "Couldn't load claim codes.")
            })
            EspressoIdlingResource.decrement()
        }

        // Return already inflated custom view
        return customView
    }

    class Adapter(private val resources: Resources) :
        RecyclerView.Adapter<RecyclerView.ViewHolder>() {

        var items: List<String> = listOf()

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
            return ViewHolder(
                LayoutInflater.from(parent.context).inflate(
                    R.layout.list_item_claim_code,
                    parent,
                    false
                )
            )
        }

        override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
            (holder as ViewHolder).onBind(items[position])
        }

        override fun getItemCount(): Int {
            return items.size
        }

        fun setData(data: List<String>) {
            if (data.isEmpty()) {
                items = listOf(resources.getString(R.string.reward_claim_code_dialog_none))
                return
            }
            items = data
        }
    }

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private var claimCodeView: EmojiTextView = view.findViewById(R.id.claim_code)
        fun onBind(claimCode: String) {
            claimCodeView.text = claimCode
        }
    }
}