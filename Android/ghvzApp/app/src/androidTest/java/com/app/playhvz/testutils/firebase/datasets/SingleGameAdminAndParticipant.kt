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