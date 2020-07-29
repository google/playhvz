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
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import androidx.fragment.app.DialogFragment
import com.app.playhvz.R
import com.app.playhvz.common.ui.MarkdownTextView
import com.app.playhvz.firebase.classmodels.Reward
import com.app.playhvz.utils.ImageDownloaderUtils

class RewardDetailsDialog(
    private val reward: Reward
) : DialogFragment() {

    companion object {
        private val TAG = RewardDetailsDialog::class.qualifiedName
    }

    private lateinit var customView: View
    private lateinit var dismissButton: ImageButton
    private lateinit var pointView: TextView
    private lateinit var rewardDescription: MarkdownTextView
    private lateinit var rewardImage: ImageView
    private lateinit var rewardTitle: MarkdownTextView

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        customView = requireActivity().layoutInflater.inflate(R.layout.dialog_reward_details, null)
        dismissButton = customView.findViewById(R.id.dismiss_button)
        pointView = customView.findViewById(R.id.reward_points)
        rewardDescription = customView.findViewById(R.id.reward_description)
        rewardImage = customView.findViewById(R.id.reward_badge_image)
        rewardTitle = customView.findViewById(R.id.reward_title)

        val dialog = AlertDialog.Builder(requireContext())
            .setView(customView)
            .create()

        val res = customView.resources

        dismissButton.setOnClickListener { dialog?.dismiss() }
        ImageDownloaderUtils.downloadSquareImage(rewardImage, reward.imageUrl!!)
        pointView.text = res.getQuantityString(
            R.plurals.reward_card_label_points,
            reward.points!!,
            reward.points
        )
        rewardTitle.text = reward.longName
        rewardDescription.text = reward.description

        return dialog
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Return already inflated custom view
        return customView
    }
}