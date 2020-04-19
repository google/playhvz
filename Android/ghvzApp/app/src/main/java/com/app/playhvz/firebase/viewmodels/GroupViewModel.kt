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

package com.app.playhvz.firebase.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import com.app.playhvz.app.HvzData
import com.app.playhvz.firebase.classmodels.Group
import com.app.playhvz.firebase.constants.GroupPath
import com.app.playhvz.firebase.utils.DataConverterUtil

class GroupViewModel : ViewModel() {
    companion object {
        private val TAG = GroupViewModel::class.qualifiedName
    }

    private var group: HvzData<Group> = HvzData()

    fun getGroup(
        gameId: String,
        groupId: String
    ): HvzData<Group> {
        if (groupId in group.docIdListeners) {
            // We're already listening to changes on this group id.
            return group
        } else {
            stopListening()
        }
        group.docIdListeners[groupId] =
            GroupPath.GROUP_DOCUMENT_REFERENCE(gameId, groupId).addSnapshotListener { snapshot, e ->
                if (e != null) {
                    Log.w(TAG, "Listen failed.", e)
                    return@addSnapshotListener
                }
                if (snapshot == null || !snapshot.exists()) {
                    return@addSnapshotListener
                }
                group.value = DataConverterUtil.convertSnapshotToGroup(snapshot)
            }
        return group
    }

    private fun stopListening() {
        for (id in group.docIdListeners.keys) {
            group.docIdListeners[id]!!.remove()
            group.docIdListeners.remove(id)
        }
    }
}