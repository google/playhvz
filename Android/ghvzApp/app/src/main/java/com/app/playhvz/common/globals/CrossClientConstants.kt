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

import android.content.Context
import android.graphics.Color
import androidx.core.content.ContextCompat
import androidx.core.content.contentValuesOf

class CrossClientConstants {
    companion object {
        const val HUMAN = "resistance"
        const val ZOMBIE = "horde"
        const val UNDECLARED = "undeclared"
        const val BLANK_ALLEGIANCE_FILTER = "none"
        val DEAD_ALLEGIANCES = arrayOf(ZOMBIE)
        const val REWARD_POINT_VALUE = 20

        const val QUIZ_TYPE_MULTIPLE_CHOICE = "multipleChoice"
        const val QUIZ_TYPE_TRUE_FALSE = "boolean"
        const val QUIZ_TYPE_ORDER = "order"
        const val QUIZ_TYPE_INFO = "info"
        const val QUIZ_BLANK_ORDER = -1

        fun getAliveColor(context: Context): Int {
            return ContextCompat.getColor(context, com.app.playhvz.R.color.aliveColor)
        }

        fun getDeadColor(context: Context): Int {
            return ContextCompat.getColor(context, com.app.playhvz.R.color.deadColor)
        }

        fun getDeclareQuizRewardCode(playerId: String): String {
            return getPlayerSpecificRewardCode("declare", playerId)
        }

        fun getPlayerSpecificRewardCode(rewardShortName: String, playerId: String): String {
            return rewardShortName + "-" + playerId + "-" + System.currentTimeMillis()
        }
    }
}