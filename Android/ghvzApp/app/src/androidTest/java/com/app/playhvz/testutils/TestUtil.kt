package com.app.playhvz.testutils

import android.app.Activity
import android.app.Instrumentation
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.intent.matcher.IntentMatchers.isInternal
import org.hamcrest.CoreMatchers.not

class TestUtil {
    companion object {
        /** Sleeps for 1 second. */
        fun pauseForDebugging() {
            Thread.sleep(1000)
        }

        /** Sleeps for a very short amount of time. */
        fun tacticalWait() {
            Thread.sleep(50)
        }

        fun stubAllExternalIntents() {
            // Call in @Before
            // By default Espresso Intents does not stub any Intents. Stubbing needs to be setup before
            // every test run. In this case all external Intents will be blocked.
            Intents.intending(not(isInternal())).respondWith(Instrumentation.ActivityResult(Activity.RESULT_OK, null))
        }
    }
}