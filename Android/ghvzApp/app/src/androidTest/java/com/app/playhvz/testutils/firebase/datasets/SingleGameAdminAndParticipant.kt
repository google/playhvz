package com.app.playhvz.testutils.firebase.datasets

class SingleGameAdminAndParticipant {
    companion object {
        const val GAME_ID = "game1"
        const val GAME_NAME = "Test Game 1"

        val SINGLE_GAME_ADMIN_AND_PARTICIPANT = GameData(
            GAME_ID,
            GAME_NAME
        )
    }
}