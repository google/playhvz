package com.app.playhvz.testutils.firebase.datasets

data class GameData(
    val id: String,
    val name: String,
    var creatorUserId: String? = null
)
