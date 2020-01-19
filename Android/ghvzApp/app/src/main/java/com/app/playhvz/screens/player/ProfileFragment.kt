package com.app.playhvz.screens.player

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.emoji.widget.EmojiTextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.navArgs
import com.app.playhvz.R
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.firebase.viewmodels.GameViewModel
import com.app.playhvz.firebase.viewmodels.PlayerViewModel


/** Fragment for showing a list of Games the user is registered for.*/
class ProfileFragment : Fragment() {
    companion object {
        private val TAG = ProfileFragment::class.qualifiedName
    }

    val args: ProfileFragmentArgs by navArgs()


    lateinit var playerViewModel: PlayerViewModel
    lateinit var gameViewModel: GameViewModel

    var gameId: String? = null
    var playerId: String? = null
    var game: Game? = null

    var nameView: EmojiTextView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        gameId = args.gameId
        playerId = args.playerId
        playerViewModel = ViewModelProvider(this).get(PlayerViewModel::class.java)
        gameViewModel = ViewModelProvider(activity!!).get(GameViewModel::class.java)

    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_player_profile, container, false)
        nameView = view.findViewById(R.id.player_name)

        setupObservers()
        setupToolbar()
        return view
    }

    fun setupToolbar() {
        val toolbar = (activity as AppCompatActivity).supportActionBar
        if (toolbar != null) {
            toolbar.title =
                if (gameViewModel.getGame()?.value?.name.isNullOrEmpty()) context!!.getString(R.string.app_name)
                else gameViewModel.getGame()?.value?.name
        }
    }

    private fun setupObservers() {
        if (gameId.isNullOrEmpty()) {
            return
        }
        println("lizard getting player model")
        if (playerId.isNullOrEmpty()) {
            // Get current user's player for this game
            playerViewModel.getPlayer(gameId!!)
                .observe(this, androidx.lifecycle.Observer { serverPlayer ->
                    updatePlayer(serverPlayer)
                })
        } else {
            playerViewModel.getPlayer(gameId!!, playerId!!)
                .observe(this, androidx.lifecycle.Observer { serverPlayer ->
                    updatePlayer(serverPlayer)
                })
        }
    }

    private fun updatePlayer(serverPlayer: Player?) {
        nameView?.setText(serverPlayer?.name)
    }
}
