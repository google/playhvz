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

/** Android data model representing Firebase Group documents. */
class Group {
    var id: String? = null

    // Name of group
    var name: String? = null

    var managed: Boolean = false
    var owners = listOf<String>()
    var settings: Settings = Settings()
    var members = listOf<String>()

    class Settings {
        var canAddSelf: Boolean = true
        var canAddOthers: Boolean = true
        var canRemoveSelf: Boolean = true
        var canRemoveOthers: Boolean = true
        var autoAdd: Boolean = false
        var autoRemove: Boolean = false
        var allegianceFilter: String = ""
    }
}