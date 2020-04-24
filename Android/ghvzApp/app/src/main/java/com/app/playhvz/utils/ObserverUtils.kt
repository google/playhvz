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

import com.app.playhvz.app.HvzData


class ObserverUtils {
    companion object {
        val TAG = ObserverUtils::class.qualifiedName

        /** Removes listeners that aren't in the list anymore. */
        // Don't use this until you implement the todos
        private fun cleanupObsoleteListeners(
            liveData: HvzData<*>,
            oldList: Set<String>,
            newList: Set<String>
        ) {
            val removedIds = oldList.minus(newList)
            stopListening(liveData, removedIds)
           // TODO: remove items from livedata value...
        }

        private fun stopListening(liveData: HvzData<*>, removedIds: Set<String>) {
            for (removedId in removedIds) {
                if (!liveData.docIdListeners.containsKey(removedId)) {
                    continue
                }
                liveData.docIdListeners[removedId]?.remove()
                liveData.docIdListeners.remove(removedId)
            }
        }
    }
}