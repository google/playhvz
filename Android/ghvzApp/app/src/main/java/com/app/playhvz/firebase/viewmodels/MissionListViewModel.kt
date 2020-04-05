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
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LiveData
import androidx.lifecycle.ViewModel
import com.app.playhvz.app.HvzData
import com.app.playhvz.firebase.classmodels.Mission
import com.app.playhvz.firebase.operations.GroupDatabaseOperations
import com.app.playhvz.firebase.operations.MissionDatabaseOperations
import com.app.playhvz.firebase.utils.DataConverterUtil
import com.google.firebase.firestore.DocumentSnapshot

class MissionListViewModel : ViewModel() {
    companion object {
        private val TAG = MissionListViewModel::class.qualifiedName
    }

    private var associatedGroupIdList: HvzData<List<String>> = HvzData(listOf())
    private var groupIdsPlayerIsInList: HvzData<List<String>> = HvzData(listOf())
    private var missionList: HvzData<Map<String, Mission?>> = HvzData(mapOf())

    /** Listens to all mission updates and returns a LiveData object list in the missions. */
    fun getAllMissionsInGame(
        lifecycleOwner: LifecycleOwner,
        gameId: String
    ): LiveData<Map<String, Mission?>> {
        if (associatedGroupIdList.hasObservers()) {
            // We've already started observing
            return missionList
        }
        associatedGroupIdList.observe(
            lifecycleOwner,
            androidx.lifecycle.Observer { updatedGroupsAssociatedWithMissions ->
                observeMissionsPlayerIsIn(
                    gameId,
                    updatedGroupsAssociatedWithMissions
                )
            })
        extractListOfGroupIdsAssociatedWithMissions(gameId)
        return missionList
    }

    /** Listens to mission group membership and returns a LiveData object listing
     * the missions the player is currently in. */
    fun getMissionListOfMissionsPlayerIsIn(
        lifecycleOwner: LifecycleOwner,
        gameId: String,
        playerId: String
    ): LiveData<Map<String, Mission?>> {
        if (associatedGroupIdList.hasObservers()) {
            // We've already started observing
            return missionList
        }
        associatedGroupIdList.observe(
            lifecycleOwner,
            androidx.lifecycle.Observer { updatedGroupsAssociatedWithMissions ->
                observeGroupsAssociatedWithMissions(
                    gameId,
                    playerId,
                    updatedGroupsAssociatedWithMissions
                )
            })
        groupIdsPlayerIsInList.observe(
            lifecycleOwner,
            androidx.lifecycle.Observer { missionGroupsPlayerIsIn ->
                observeMissionsPlayerIsIn(gameId, missionGroupsPlayerIsIn)
            })
        listenToGroupPlayerIds(gameId, playerId)
        return missionList
    }

    /** Listens to mission group membership and returns a LiveData object listing
     * the missions the player is currently in. */
    fun getLatestMissionPlayerIsIn(
        lifecycleOwner: LifecycleOwner,
        gameId: String,
        playerId: String
    ): LiveData<Map<String, Mission?>> {
        if (associatedGroupIdList.hasObservers()) {
            // We've already started observing
            return missionList
        }
        associatedGroupIdList.observe(
            lifecycleOwner,
            androidx.lifecycle.Observer { updatedGroupsAssociatedWithMissions ->
                observeGroupsAssociatedWithMissions(
                    gameId,
                    playerId,
                    updatedGroupsAssociatedWithMissions
                )
            })
        groupIdsPlayerIsInList.observe(
            lifecycleOwner,
            androidx.lifecycle.Observer { missionGroupsPlayerIsIn ->
                observeLatestMissionPlayerIsIn(gameId, missionGroupsPlayerIsIn)
            })
        listenToGroupPlayerIds(gameId, playerId)
        return missionList
    }

    /** Registers an event listener that watches for group membership changes. */
    private fun listenToGroupPlayerIds(gameId: String, playerId: String) {
        extractListOfGroupIdsAssociatedWithMissions(gameId)
    }

    private fun extractListOfGroupIdsAssociatedWithMissions(gameId: String) {
        val missionCollectionListener =
            MissionDatabaseOperations.getGroupsAssociatedWithMissons(gameId)
                .addSnapshotListener { querySnapshot, e ->
                    if (e != null) {
                        Log.w(TAG, "Listen to missions failed. ", e)
                        associatedGroupIdList.value = emptyList()
                        return@addSnapshotListener
                    }
                    if (querySnapshot == null || querySnapshot.isEmpty || querySnapshot.documents.isEmpty()) {
                        associatedGroupIdList.value = emptyList()
                        return@addSnapshotListener
                    }
                    val mutableListOfGroupIds = mutableListOf<String>()
                    for (missionSnapshot in querySnapshot.documents) {
                        val mission = DataConverterUtil.convertSnapshotToMission(missionSnapshot)
                        if (mission.associatedGroupId.isNullOrEmpty()) {
                            continue
                        }
                        mutableListOfGroupIds.add(mission.associatedGroupId!!)
                    }
                    associatedGroupIdList.value = mutableListOfGroupIds.toList()
                }
        associatedGroupIdList.docIdListeners[gameId] = missionCollectionListener
    }

    private fun observeGroupsAssociatedWithMissions(
        gameId: String,
        playerId: String,
        updatedGroupsAssociatedWithMissions: List<String>
    ) {
        // Of the groupIds associated with missions, narrow the list down to groups that have the player as a member
        if (updatedGroupsAssociatedWithMissions.isEmpty()) {
            return
        }
        val groupMembershipListener =
            GroupDatabaseOperations.getMissionGroupsPlayerIsIn(
                gameId,
                playerId,
                updatedGroupsAssociatedWithMissions
            )
                .addSnapshotListener { querySnapshot, e ->
                    if (e != null) {
                        Log.w(TAG, "Listen to missions group memberships failed. ", e)
                        groupIdsPlayerIsInList.value = emptyList()
                        return@addSnapshotListener
                    }
                    if (querySnapshot == null || querySnapshot.isEmpty || querySnapshot.documents.isEmpty()) {
                        Log.d(TAG, "Player isn't in any groups associated with missions.")
                        groupIdsPlayerIsInList.value = emptyList()
                        return@addSnapshotListener
                    }
                    val mutableList = mutableListOf<String>()
                    for (groupSnapshot in querySnapshot.documents) {
                        val group = DataConverterUtil.convertSnapshotToGroup(groupSnapshot)
                        if (group.id.isNullOrEmpty()) {
                            continue
                        }
                        mutableList.add(group.id!!)
                    }
                    groupIdsPlayerIsInList.value = mutableList.toList()

                }
        groupIdsPlayerIsInList.docIdListeners[gameId] = groupMembershipListener
    }

    /** Listens to updates on every chat room the player is a member of. */
    private fun observeMissionsPlayerIsIn(
        gameId: String,
        missionGroupsPlayerIsIn: List<String>
    ): LiveData<Map<String, Mission?>> {
        if (missionGroupsPlayerIsIn.isEmpty()) {
            return missionList
        }
        val missionListener = MissionDatabaseOperations.getMissionsAssociatedWithGroups(
            gameId,
            missionGroupsPlayerIsIn
        ).addSnapshotListener { querySnapshot, e ->
            if (e != null) {
                Log.w(TAG, "Getting mission list failed. ", e)
                return@addSnapshotListener
            }
            if (querySnapshot == null) {
                return@addSnapshotListener
            }
            val updatedMissionIds = mutableSetOf<String>()
            for (missionSnapshot in querySnapshot.documents) {
                updatedMissionIds.add(missionSnapshot.id)
                maybeListenToMission(gameId, missionSnapshot)
            }

            // Remove mission listeners for missions the user isn't a member of anymore.
            val removedMissions =
                missionList.docIdListeners.keys.toSet().minus(updatedMissionIds.toSet())
            stopListening(removedMissions)
        }
        missionList.docIdListeners[gameId] = missionListener
        return missionList
    }

    private fun maybeListenToMission(gameId: String, missionSnapshot: DocumentSnapshot) {
        val mission = DataConverterUtil.convertSnapshotToMission(missionSnapshot)
        if (mission.id in missionList.docIdListeners) {
            // We're already listening to this mission.
            return
        }
        missionList.docIdListeners[mission.id!!] =
            MissionDatabaseOperations.getMissionDocumentReference(gameId, mission.id!!)
                .addSnapshotListener { snapshot, e ->
                    if (e != null) {
                        Log.w(TAG, "Mission listen failed. ", e)
                        return@addSnapshotListener
                    }
                    if (snapshot == null || !snapshot.exists()) {
                        val updatedMissionList = missionList.value!!.toMutableMap()
                        updatedMissionList.remove(mission.id!!)
                        missionList.value = updatedMissionList
                        return@addSnapshotListener
                    }
                    val updatedMission = DataConverterUtil.convertSnapshotToMission(snapshot)
                    val updatedMissionList = missionList.value!!.toMutableMap()
                    updatedMissionList[mission.id!!] = updatedMission
                    missionList.value = updatedMissionList
                }
    }

    private fun stopListening(removedIds: Set<String>) {
        for (removedId in removedIds) {
            if (!missionList.docIdListeners.containsKey(removedId)) {
                continue
            }
            val updatableMissionList = missionList.value!!.toMutableMap()
            updatableMissionList.remove(removedId)
            missionList.value = updatableMissionList
            missionList.docIdListeners[removedId]?.remove()
            missionList.docIdListeners.remove(removedId)
        }
    }

    /** Listens to updates on every chat room the player is a member of. */
    private fun observeLatestMissionPlayerIsIn(
        gameId: String,
        missionGroupsPlayerIsIn: List<String>
    ): LiveData<Map<String, Mission?>> {
        if (missionGroupsPlayerIsIn.isEmpty()) {
            return missionList
        }
        val missionListener = MissionDatabaseOperations.getLatestMission(
            gameId,
            missionGroupsPlayerIsIn
        ).addSnapshotListener { querySnapshot, e ->
            if (e != null) {
                Log.w(TAG, "Getting mission list failed. ", e)
                return@addSnapshotListener
            }
            if (querySnapshot == null) {
                return@addSnapshotListener
            }
            val updatedMissionIds = mutableSetOf<String>()
            for (missionSnapshot in querySnapshot.documents) {
                updatedMissionIds.add(missionSnapshot.id)
                maybeListenToMission(gameId, missionSnapshot)
            }

            // Remove mission listeners for missions the user isn't a member of anymore.
            val removedMissions =
                missionList.docIdListeners.keys.toSet().minus(updatedMissionIds.toSet())
            stopListening(removedMissions)
        }
        missionList.docIdListeners[gameId] = missionListener
        return missionList
    }
}