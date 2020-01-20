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

package com.app.playhvz.testutils

import androidx.test.espresso.IdlingRegistry
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreSettings
import io.mockk.every
import io.mockk.mockkClass
import io.mockk.mockkStatic

class PlayHvzTestHelper {
    private companion object {
        const val UI_TIMEOUT = 2500L
    }

    fun initializeTestEnvironment() {
        val simulatedDevice = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        IdlingRegistry.getInstance().register(EspressoIdlingResource.countingIdlingResource)

        // Mock Firebase libraries
        mockkStatic(FirebaseProvider::class)
        every { FirebaseProvider.getFirebaseAuth() } returns mockkClass(FirebaseAuth::class)
        every { FirebaseProvider.getFirebaseFirestore() } returns mockkClass(FirebaseFirestore::class)
        every {
            FirebaseProvider.getFirebaseFirestore().firestoreSettings
        } answers {
            return@answers mockkClass(FirebaseFirestoreSettings::class)
        }

        every {
            FirebaseProvider.getFirebaseFirestore().setFirestoreSettings(any())
        } answers {}

    }

    fun tearDownTestEnvironment() {
        IdlingRegistry.getInstance().unregister(EspressoIdlingResource.countingIdlingResource)
    }
}