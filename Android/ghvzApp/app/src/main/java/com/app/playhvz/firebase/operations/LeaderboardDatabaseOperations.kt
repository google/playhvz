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

package com.app.playhvz.firebase.operations

import com.app.playhvz.firebase.classmodels.Player
import com.app.playhvz.firebase.constants.PlayerPath
import com.google.firebase.firestore.Query

class LeaderboardDatabaseOperations {
    companion object {
        private val TAG = LeaderboardDatabaseOperations::class.qualifiedName

        val PAGINATION_LIMIT: Long = 40

        /** Returns a Query listing all players in the given game ordered by score. */
        fun getPlayersByScoreQuery(gameId: String): Query? {
            return PlayerPath.PLAYERS_COLLECTION(gameId)
                .orderBy(Player.FIELD__POINTS, Query.Direction.DESCENDING)
                .limit(PAGINATION_LIMIT)
        }

        /** Returns a Query listing all players of allegiance in the given game ordered by score. */
        fun getPlayersByAllegianceAndScoreQuery(gameId: String, allegiance: String, pageLimit: Long = PAGINATION_LIMIT): Query? {
            return PlayerPath.PLAYERS_COLLECTION(gameId)
                .whereEqualTo(Player.FIELD__ALLEGIANCE, allegiance)
                .orderBy(Player.FIELD__POINTS, Query.Direction.DESCENDING)
                .limit(pageLimit)
        }
    }
}