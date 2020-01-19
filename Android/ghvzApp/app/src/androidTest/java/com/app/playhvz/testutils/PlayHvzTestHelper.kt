package com.app.playhvz.testutils

import androidx.test.espresso.IdlingRegistry
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
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