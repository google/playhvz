package com.app.playhvz.screens.gamelist

import android.view.View
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R

class HeaderViewHolder(view: View) : RecyclerView.ViewHolder(view) {

    val gameHeaderTextView = view.findViewById<TextView>(R.id.game_list_header_text)

    fun onBind(category: String?) {
        gameHeaderTextView.text = category
    }
}