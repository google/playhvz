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
    // Game Id
    var id: String? = null

    // Name of the game
    var name: String? = null

    // Creator of the game
    var creatorUserId: String? = null

    var rules: List<CollapsibleSection> = listOf()

    var faq: List<CollapsibleSection> = listOf()

    class CollapsibleSection {
        var order: Int = 0
        var sectionTitle: String = ""
        var sectionContent: String = ""
    }
}