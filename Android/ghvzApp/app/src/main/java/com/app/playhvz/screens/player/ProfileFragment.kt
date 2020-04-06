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

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.emoji.widget.EmojiTextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.navArgs
import com.app.playhvz.R
import com.app.playhvz.common.UserAvatarPresenter
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.classmodels.Player
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
    lateinit var userAvatarPresenter: UserAvatarPresenter

    private lateinit var allegianceView: TextView
    private lateinit var avatarView: View
    private lateinit var nameView: EmojiTextView

    var gameId: String? = null
    var playerId: String? = null
    var game: Game? = null

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
        avatarView = view.findViewById(R.id.player_avatar)
        allegianceView = view.findViewById(R.id.player_allegiance)

        userAvatarPresenter = UserAvatarPresenter(avatarView, R.dimen.avatar_large)

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
        if (serverPlayer == null) {
            return
        }
        nameView.setText(serverPlayer.name)
        userAvatarPresenter.renderAvatar(serverPlayer)
        allegianceView.setText(serverPlayer.allegiance)
    }
}
