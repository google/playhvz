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
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.firebase.classmodels.Game
import com.app.playhvz.firebase.operations.GameDatabaseOperations.Companion.getGameByCreatorQuery
import com.app.playhvz.firebase.operations.GameDatabaseOperations.Companion.getGameByPlayerQuery
import com.app.playhvz.firebase.utils.DataConverterUtil
import com.app.playhvz.firebase.utils.FirebaseDatabaseUtil
import com.google.android.gms.tasks.OnSuccessListener
import com.google.firebase.firestore.EventListener
import com.google.firebase.firestore.QuerySnapshot
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.async
import kotlinx.coroutines.launch

class GameListViewModel : ViewModel() {
    companion object {
        private val TAG = GameListViewModel::class.qualifiedName
    }

    private var ownedGames: MutableLiveData<List<Game>> = MutableLiveData()
    private var participantGames: MutableLiveData<List<Game>> = MutableLiveData()


    fun getOwnedGames(): LiveData<List<Game>> {
        getGameByCreatorQuery()?.addSnapshotListener(EventListener<QuerySnapshot> { snapshot, e ->
            if (e != null) {
                Log.w(TAG, "Listen failed. ", e)
                ownedGames.value = emptyList()
                return@EventListener
            }

            val ownedGamesList: MutableList<Game> = mutableListOf()
            for (doc in snapshot!!) {
                ownedGamesList.add(DataConverterUtil.convertSnapshotToGame(doc))
            }
            ownedGames.value = ownedGamesList
        })

        return ownedGames
    }

    //fun getParticipantGames(): LiveData<List<Game>> {
    fun getParticipantGames(): MutableLiveData<List<Game>> {
        getGameByPlayerQuery()?.addSnapshotListener(EventListener<QuerySnapshot> { snapshot, e ->
            if (e != null) {
                Log.w(TAG, "Listen failed. ", e)
                participantGames.value = emptyList()
                return@EventListener
            }

            val asyncParticipantGamesList: MutableList<Game> = mutableListOf()
            GlobalScope.launch(Dispatchers.Main) {
                EspressoIdlingResource.increment()
                /* Asynchronously fetch every Game for each Player returned by our query. */
                // Launch children requests that are all controlled by a single parent request.
                for (doc in snapshot!!) {
                    async {
                        FirebaseDatabaseUtil.asyncGet(
                            doc.reference.parent.parent, OnSuccessListener { document ->
                                if (document != null && document.exists()) {
                                    asyncParticipantGamesList.add(
                                        DataConverterUtil.convertSnapshotToGame(
                                            document
                                        )
                                    )
                                }
                            })
                    }.await()
                }
                EspressoIdlingResource.decrement()
                participantGames.value = asyncParticipantGamesList
            }
        })

        return participantGames
    }
}