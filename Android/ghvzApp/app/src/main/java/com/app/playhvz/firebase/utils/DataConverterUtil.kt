package com.app.playhvz.firebase.utils

import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.classmodels.Player
import com.google.firebase.firestore.DocumentSnapshot

class DataConverterUtil {
    companion object {
        fun convertSnapshotToGame(document: DocumentSnapshot): Game {
            val game = document.toObject(Game::class.java)!!
            game.id = document.id
            return game
        }

        fun convertSnapshotToPlayer(document: DocumentSnapshot): Player {
            val player = document.toObject(Player::class.java)!!
            player.id = document.id
            return player
        }

        fun convertSnapshotToPlayerPrivateData(document: DocumentSnapshot): Player.Private {
            return document.toObject(Player.Private::class.java)!!
        }

        fun convertSnapshotToPlayerPublicData(document: DocumentSnapshot): Player {
            return document.toObject(Player::class.java)!!
        }
    }
}