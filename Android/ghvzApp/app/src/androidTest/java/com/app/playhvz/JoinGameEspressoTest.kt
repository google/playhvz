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

package com.app.playhvz

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.rule.ActivityTestRule
import com.app.playhvz.firebase.constants.GamePath
import com.app.playhvz.firebase.constants.PlayerPath
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.screens.MainActivity
import com.app.playhvz.testutils.PlayHvzTestHelper
import com.app.playhvz.testutils.TestUtil
import com.app.playhvz.testutils.firebase.FirebaseTestUtil
import com.app.playhvz.testutils.firebase.MockAuthManager
import com.app.playhvz.testutils.firebase.MockDatabaseManager
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.QueryDocumentSnapshot
import com.google.firebase.firestore.QuerySnapshot
import io.mockk.every
import io.mockk.mockkClass
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@LargeTest
class JoinGameEspressoTest {

    @get:Rule
    val activityRule =
        ActivityTestRule(MainActivity::class.java, true, /* launchActivity= */ false)

    private val helper: PlayHvzTestHelper = PlayHvzTestHelper()
    private var mockAuthManager: MockAuthManager? = null
    private var mockDatabaseManager: MockDatabaseManager? = null

    @Before
    fun setup() {
        helper.initializeTestEnvironment()

        mockAuthManager = MockAuthManager(FirebaseProvider.getFirebaseAuth())
        mockDatabaseManager = MockDatabaseManager(FirebaseProvider.getFirebaseFirestore())

        mockAuthManager!!.useSignedInUser()
        mockDatabaseManager!!.initializePassingVersionCodeCheck()
        mockDatabaseManager!!.initilizeCollectionMocks()

        // Initialize empty game lists
        val mockAdminQuery = mockkClass(Query::class)
        val mockAdminQuerySnapshot = mockkClass(QuerySnapshot::class)
        val adminGameResultList: MutableList<QueryDocumentSnapshot> =
            mutableListOf()

        every {
            mockDatabaseManager!!.collectionMap!![GamePath.GAME_COLLECTION_PATH]!!.whereEqualTo(
                any<String>(),
                mockAuthManager!!.USER_ID
            )
        } returns mockAdminQuery
        every { mockAdminQuerySnapshot.documents } returns mutableListOf()
        every { mockAdminQuerySnapshot.iterator() } answers {
            return@answers adminGameResultList.iterator()
        }
        FirebaseTestUtil.onAddQuerySnapshotListener(mockAdminQuery, mockAdminQuerySnapshot)

        val mockPlayerQuery = mockkClass(Query::class)
        val mockPlayerQuerySnapshot = mockkClass(QuerySnapshot::class)
        val playerGameResultList: MutableList<QueryDocumentSnapshot> =
            mutableListOf()

        every {
            mockDatabaseManager!!.collectionMap!![PlayerPath.PLAYER_COLLECTION_PATH]!!.whereEqualTo(
                any<String>(),
                mockAuthManager!!.USER_ID
            )
        } returns mockPlayerQuery

        every {
            mockDatabaseManager!!.collectionMap!![GamePath.GAME_COLLECTION_PATH]!!.whereEqualTo(
                any<String>(),
                mockAuthManager!!.USER_ID
            )
        } returns mockPlayerQuery
        every { mockPlayerQuerySnapshot.documents } returns mutableListOf()
        every { mockPlayerQuerySnapshot.iterator() } answers {
            return@answers playerGameResultList.iterator()
        }
        FirebaseTestUtil.onAddQuerySnapshotListener(mockPlayerQuery, mockPlayerQuerySnapshot)
    }

    @After
    fun tearDown() {
        helper.tearDownTestEnvironment()
    }

    @Test
    fun whenNoGames_showsEmptyGameView() {
        startApp()

        TestUtil.pauseForDebugging()
        onView(withId(R.id.empty_game_list_view)).check(matches(isDisplayed()))
    }

    @Test
    fun whenNoGames_clicksJoinGame_opensDialog() {
        startApp()

        onView(withId(R.id.join_button)).perform(click())
        onView(withId(R.id.editText)).check(matches(isDisplayed()))
    }

    /*   @Test
       fun whenNoGames_clicksJoinGame_callsFirebaseToJoinGame() {
           val gameName = "Test Game"
           val gameId = "game1234"
           // Allow for joining game
           val mockGameQuery = mockkClass(Query::class)
           val mockGameTask: Task<QuerySnapshot> = mockk<Task<QuerySnapshot>>()
           val mockGameQuerySnapshot = mockkClass(QuerySnapshot::class)
           val mockGame = mockkClass(DocumentSnapshot::class)

           every {
               mockDatabaseManager!!.collectionMap!![GamePath.GAME_COLLECTION_PATH]!!.whereEqualTo(
                   GAME_FIELD__NAME,
                   gameName
               )
           } returns mockGameQuery
           every { mockGameQuery.get() } returns mockGameTask
           FirebaseTestUtil.onTaskAddSnapshotListener(mockGameTask, mockGameQuerySnapshot)
           every { mockGame.id } returns gameId
           // fail fast, we just want to verify we got to this point then end the test.
           every { mockGameQuerySnapshot.isEmpty } returns true

           startApp()

           onView(withId(R.id.join_button)).perform(click())
           onView(withId(R.id.gameNameText)).perform(typeText(gameName))
           TestUtil.pauseForDebugging()
           onView(withText(android.R.string.ok)).perform(click())

           TestUtil.pauseForDebugging()

           verify(exactly = 1) { mockGameTask.addOnSuccessListener(any()) }
       }
   */
    private fun startApp() {
        activityRule.launchActivity(null)
    }
}