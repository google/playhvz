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

import com.app.playhvz.common.globals.CrossClientConstants.Companion.DEAD_ALLEGIANCES


class PlayerUtil {
    companion object {
        enum class AliveStatus { ALIVE, DEAD }

        /** Returns whether the current player allegiance is considered Alive or Dead. */
        fun getAliveStatus(allegiance: String): AliveStatus {
            return if (DEAD_ALLEGIANCES.contains(allegiance)) {
                AliveStatus.DEAD
            } else {
                AliveStatus.ALIVE
            }
        }
    }
}