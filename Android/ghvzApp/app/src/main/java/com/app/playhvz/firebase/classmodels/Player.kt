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

import com.app.playhvz.firebase.constants.PlayerPath.Companion.PLAYER_FIELD__LIFE_CODE
import com.app.playhvz.firebase.constants.PlayerPath.Companion.PLAYER_FIELD__LIFE_CODE_STATUS
import com.app.playhvz.firebase.constants.PlayerPath.Companion.PLAYER_FIELD__LIFE_CODE_TIMESTAMP
import com.google.firebase.Timestamp

/** Android data model representing Firebase Player documents. */
class Player {
    companion object {
        const val FIELD__CHAT_MEMBERSHIPS = "chatRoomMemberships"
        const val FIELD__CHAT_MEMBERSHIP_IS_VISIBLE = "isVisible"
        const val FIELD__CHAT_MEMBERSHIP_ALLOW_NOTIFICATIONS = "allowNotifications"
        const val FIELD__AVATAR_URL = "avatarUrl"
    }

    var id: String? = null

    // UserId for the User that owns this player account
    lateinit var userId: String

    // Name of the player
    var name: String? = null

    // Url of the player's avatar image
    var avatarUrl: String = ""

    // Current faction the player is fighting for
    var allegiance: String = ""

    var chatRoomMemberships: Map<String, Map<String, Boolean>> = mapOf()

    /** Raw data from firestore, shouldn't be used directly. */
    var lives: Map<String, Map<String, *>> = mapOf()

    var lifeCodes: MutableMap<String, LifeCodeMetadata> = mutableMapOf()

    inner class LifeCodeMetadata(key: String) {
        var lifeCode: String
        var isActive: Boolean = true
        var created: Timestamp

        init {
            lifeCode = lives.getValue(key)[PLAYER_FIELD__LIFE_CODE] as String
            isActive = lives.getValue(key)[PLAYER_FIELD__LIFE_CODE_STATUS] as Boolean
            created = lives.getValue(key)[PLAYER_FIELD__LIFE_CODE_TIMESTAMP] as Timestamp
        }
    }
}