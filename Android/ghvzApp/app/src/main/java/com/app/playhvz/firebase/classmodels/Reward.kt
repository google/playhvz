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

import com.google.firebase.Timestamp
import java.util.*
import kotlin.collections.HashMap

/** Android data model representing Firebase Reward documents. */
class Reward {
    companion object {
        const val FIELD__SHORT_NAME = "shortName"
        const val FIELD__LONG_NAME = "longName"
        const val FIELD__DESCRIPTION = "description"
        const val FIELD__IMAGE_URL = "imageUrl"
        const val FIELD__POINTS = "points"

        fun createFirebaseObject(rewardDraft: Reward): HashMap<String, Any?> {
            val data = HashMap<String, Any?>()
            data[FIELD__SHORT_NAME] = rewardDraft.shortName
            data[FIELD__LONG_NAME] = rewardDraft.longName
            data[FIELD__DESCRIPTION] = rewardDraft.description
            data[FIELD__IMAGE_URL] = rewardDraft.imageUrl
            data[FIELD__POINTS] = rewardDraft.points
            return data
        }
    }

    var id: String? = null
    var shortName: String? = null
    var longName: String? = ""
    var description: String? = ""
    var points: Int? = null
    var imageUrl: String? = ""
    var managed: Boolean = true
}