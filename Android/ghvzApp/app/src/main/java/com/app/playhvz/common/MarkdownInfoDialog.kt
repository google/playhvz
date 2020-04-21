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

package com.app.playhvz.common

import android.app.AlertDialog
import android.app.Dialog
import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import androidx.fragment.app.DialogFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.common.ui.MarkdownTextView

class MarkdownInfoDialog() : DialogFragment() {
    companion object {
        private val TAG = MarkdownInfoDialog::class.qualifiedName
    }

    private val HELP_STRING_IDS = listOf(
        R.string.markdown_hint_bold,
        R.string.markdown_hint_italic,
        R.string.markdown_hint_strike,
        R.string.markdown_hint_heading1,
        R.string.markdown_hint_heading2,
        R.string.markdown_hint_heading3,
        R.string.markdown_hint_heading4,
        R.string.markdown_hint_heading5,
        R.string.markdown_hint_heading6
    )

    private lateinit var customView: View

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        customView = activity!!.layoutInflater.inflate(R.layout.dialog_markdown_info, null)
        val recyclerView = customView.findViewById<RecyclerView>(R.id.markdown_example_list)
        val adapter = HelpItemAdapter(context!!)
        recyclerView.layoutManager = LinearLayoutManager(context)
        recyclerView.adapter = adapter
        adapter.setResIds(HELP_STRING_IDS)
        adapter.notifyDataSetChanged()

        val dialog = AlertDialog.Builder(context!!)
            .setView(customView)
            .create()

        val negativeButton = customView.findViewById<ImageButton>(R.id.negative_button)
        negativeButton.setOnClickListener {
            dialog?.dismiss()
        }
        return dialog
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Return already inflated custom view
        return customView
    }

    class HelpItemAdapter(val context: Context) :
        RecyclerView.Adapter<RecyclerView.ViewHolder>() {
        var data: List<Int> = listOf()
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
            return HelpItemViewHolder(
                LayoutInflater.from(context).inflate(
                    R.layout.list_item_markdown_example,
                    parent,
                    false
                )
            )
        }

        override fun getItemCount(): Int {
            return data.size
        }

        override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
            (holder as HelpItemViewHolder).onBind(context.getString(data[position]))
        }

        fun setResIds(resIds: List<Int>) {
            data = resIds
        }
    }

    class HelpItemViewHolder(val view: View) : RecyclerView.ViewHolder(view) {
        private val exampleText = view.findViewById<TextView>(R.id.example_text)
        private val displayText = view.findViewById<MarkdownTextView>(R.id.display_text)
        fun onBind(markdownString: String) {
            exampleText.text = markdownString
            displayText.text = markdownString
        }
    }
}