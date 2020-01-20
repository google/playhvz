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

import android.app.Instrumentation
import android.content.Intent
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.intent.matcher.IntentMatchers.hasAction
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.rule.ActivityTestRule
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.screens.signin.SignInActivity
import com.app.playhvz.screens.signin.SignInActivity.Companion.GOOGLE_SIGN_IN_REQUEST_CODE
import com.app.playhvz.testutils.PlayHvzTestHelper
import com.app.playhvz.testutils.firebase.MockAuthManager
import com.app.playhvz.testutils.firebase.MockDatabaseManager
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@LargeTest
class AccountSignInEspressoTest {

    // Delay launching activity so we can mock Firebase before the app starts.
    @get:Rule
    val activityRule =
        ActivityTestRule(SignInActivity::class.java, true, /* launchActivity= */ false)

    private val helper: PlayHvzTestHelper = PlayHvzTestHelper()

    @Before
    fun setup() {
        helper.initializeTestEnvironment()

        val mockAuthManager = MockAuthManager(FirebaseProvider.getFirebaseAuth())
        mockAuthManager.useNoOneSignedIn()

        val mockDatabaseManager = MockDatabaseManager(FirebaseProvider.getFirebaseFirestore())
        mockDatabaseManager.initializePassingVersionCodeCheck()

        activityRule.launchActivity(null)
    }

    @After
    fun tearDown() {
        helper.tearDownTestEnvironment()
    }

    @Test
    fun signInButton_isDisplayed() {
        onView(withId(R.id.sign_in_button)).check(matches(isDisplayed()))
    }

    @Test
    fun signInButton_intentsToGoogleSignIn() {
        val result = Instrumentation.ActivityResult(GOOGLE_SIGN_IN_REQUEST_CODE + 1, Intent())
        Intents.init()
        Intents.intending(hasAction("com.google.android.gms.auth.GOOGLE_SIGN_IN"))
            .respondWith(result)
        onView(withId(R.id.sign_in_button)).perform(click())
        Intents.intended(hasAction("com.google.android.gms.auth.GOOGLE_SIGN_IN"))
        Intents.release()
    }
}