package com.app.playhvz.screens.gamedashboard

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.navArgs
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.viewmodels.GameViewModel

/** Fragment for showing a list of Games the user is registered for.*/
class GameDashboardFragment : Fragment() {
    companion object {
        private val TAG = GameDashboardFragment::class.qualifiedName
    }

    lateinit var firestoreViewModel: GameViewModel
    val args: GameDashboardFragmentArgs by navArgs()

    var gameId: String? = null
    var game: Game? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        gameId = args.gameId
        firestoreViewModel = ViewModelProvider(activity!!).get(GameViewModel::class.java)

        setupObservers()
        setupToolbar()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_game_dashboard, container, false)
        return view
    }

    fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        if (toolbar != null) {
            toolbar.title =
                if (game == null || game?.name.isNullOrEmpty()) context!!.getString(R.string.app_name)
                else game?.name
            toolbar.setDisplayHomeAsUpEnabled(false)
        }
    }

    private fun setupObservers() {
        if (gameId == null) {
            return
        }
        firestoreViewModel.getGame(gameId!!)
            .observe(this, androidx.lifecycle.Observer { serverGame ->
                updateGame(serverGame)
            })
    }

    private fun updateGame(serverGame: Game?) {
        game = serverGame
        setupToolbar()
    }
}