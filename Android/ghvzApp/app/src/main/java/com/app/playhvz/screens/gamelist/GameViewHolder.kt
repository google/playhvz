package com.app.playhvz.screens.gamelist

import android.view.View
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.Game

class GameViewHolder(val view: View) : RecyclerView.ViewHolder(view) {

    var game: Game? = null
    val gameNameTextView = view.findViewById<TextView>(R.id.game_name)

    fun onBind(game: Game?, navigator: GameListAdapter.IFragmentNavigator) {
        this.game = game
        gameNameTextView.text = game?.name
        itemView.setOnClickListener {
            navigator.onGameClicked(game?.id!!)
        }
    }
}