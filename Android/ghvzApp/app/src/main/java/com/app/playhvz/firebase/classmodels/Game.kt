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

/** Android data model representing Firebase Game documents. */
class Game {
    companion object {
        const val EMPTY_TIMESTAMP = 0L
        const val FIELD__RULES = "rules"
        const val FIELD__FAQ = "faq"
    }

    // Game Id
    var id: String? = null

    // Name of the game
    var name: String? = null

    var startTime: Long = EMPTY_TIMESTAMP
    var endTime: Long = EMPTY_TIMESTAMP

    // Creator of the game
    var creatorUserId: String? = null

    var adminGroupId: String? = null

    var adminOnCallPlayerId: String? = null

    var figureheadAdminPlayerAccount: String? = null
    var infectRewardId: String? = null

    var admins: List<String> = listOf()

    var rules: List<CollapsibleSection> = listOf()

    var faq: List<CollapsibleSection> = listOf()

    class CollapsibleSection {
        var order: Int = 0
        var sectionTitle: String = ""
        var sectionContent: String = ""
    }
}