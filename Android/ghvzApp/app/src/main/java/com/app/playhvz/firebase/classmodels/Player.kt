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