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

import com.app.playhvz.common.globals.CrossClientConstants

/** Android data model representing Firebase Mission documents. */
class Mission {
    companion object {
        val EMPTY_TIMESTAMP = 0L
    }

    var id: String? = null

    // Name of the mission
    var name: String? = null
    var details: String? = null
    var allegianceFilter: String = CrossClientConstants.BLANK_ALLEGIANCE_FILTER

    var startTime: Long = EMPTY_TIMESTAMP
    var endTime: Long = EMPTY_TIMESTAMP

    var associatedGroupId: String? = null
}