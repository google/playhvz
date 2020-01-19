package com.app.playhvz.screens.gamelist

import android.view.View
import android.widget.Button
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R

class JoinButtonViewHolder(view: View) : RecyclerView.ViewHolder(view) {

    private val button = view.findViewById<Button>(R.id.join_button)

    fun onBind(labelId: Int, onClickListener: View.OnClickListener) {
        button.setText(labelId)
        button.setOnClickListener(onClickListener)
    }
}