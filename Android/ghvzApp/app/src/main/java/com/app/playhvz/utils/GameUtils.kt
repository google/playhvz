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

package com.app.playhvz.utils

import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider

class GameUtils {
    companion object {
        val TAG = GameUtils::class.qualifiedName

        /** Returns whether the current player is a game admin or not. */
        fun isAdmin(game: Game): Boolean {
            return game.creatorUserId == FirebaseProvider.getFirebaseAuth().uid
        }
    }
}