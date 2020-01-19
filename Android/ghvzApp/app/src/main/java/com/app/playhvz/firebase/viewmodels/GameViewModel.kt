package com.app.playhvz.firebase.viewmodels

import android.util.Log
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.constants.GamePath
import com.app.playhvz.firebase.utils.DataConverterUtil

class GameViewModel : ViewModel() {
    companion object {
        private val TAG = GameViewModel::class.qualifiedName
    }

    private var game: MutableLiveData<Game> = MutableLiveData()

    /** Returns a Game LiveData object for the given id. */
    fun getGame(gameId: String): MutableLiveData<Game> {
        GamePath.GAMES_COLLECTION.document(gameId)
            .addSnapshotListener { snapshot, e ->
                if (e != null) {
                    Log.w(TAG, "Listen failed.", e)
                    return@addSnapshotListener
                }
                if (snapshot != null && snapshot.exists()) {
                    game.value = DataConverterUtil.convertSnapshotToGame(snapshot)
                }
            }
        return game
    }

    /** Returns the latest LiveData object we requested. */
    fun getGame(): MutableLiveData<Game>? {
        return if (game.value != null) game else null
    }
}