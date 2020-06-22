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

package com.app.playhvz.common.globals

import android.graphics.Color

class CrossClientConstants {
    companion object {
        const val HUMAN = "resistance"
        const val ZOMBIE = "horde"
        const val UNDECLARED = "undeclared"
        const val BLANK_ALLEGIANCE_FILTER = "none"
        val DEAD_ALLEGIANCES = arrayOf(ZOMBIE)
        const val ALIVE_COLOR: Int = Color.MAGENTA
        const val DEAD_COLOR: Int = Color.GREEN
        const val DEFAULT_REWARD_POINT_VALUE = 20
    }
}