package com.app.playhvz.firebase.classmodels

/** Android data model representing Firebase Player documents. */
class Player {
    var id: String? = null

    // UserId for the User that owns this player account
    lateinit var userId: String

    // Name of the player
    var name: String? = null

    var private : Private? = null

    /** Fields visible only to the current player. */
    class Private {
        // Player's life code
        var lifeCode: String? = null
    }
}