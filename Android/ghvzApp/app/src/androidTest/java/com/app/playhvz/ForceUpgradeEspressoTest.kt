package com.app.playhvz

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.rule.ActivityTestRule
import com.app.playhvz.firebase.constants.PathConstants
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.screens.signin.SignInActivity
import com.app.playhvz.testutils.PlayHvzTestHelper
import com.app.playhvz.testutils.firebase.FirebaseTestUtil
import com.app.playhvz.testutils.firebase.MockAuthManager
import com.app.playhvz.testutils.firebase.MockDatabaseManager
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.DocumentSnapshot
import io.mockk.every
import io.mockk.verify
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@LargeTest
class ForceUpgradeEspressoTest {
    companion object {
        const val MINIMUM_SUPPORTED_APP_VERSION = 9999999L
    }

    // Delay launching activity so we can mock Firebase before the app starts.
    @get:Rule
    val activityRule = ActivityTestRule<SignInActivity>(
        SignInActivity::class.java,
        true,
        /* launchActivity= */false
    )

    private val helper: PlayHvzTestHelper = PlayHvzTestHelper()


    private var mockAuthManager: MockAuthManager? = null
    private var mockDatabaseManager: MockDatabaseManager? = null
    private var versionCodeDocument: DocumentReference? = null
    private var mockSnapshot: DocumentSnapshot? = null

    @Before
    fun setup() {
        helper.initializeTestEnvironment()

        mockAuthManager = MockAuthManager(FirebaseProvider.getFirebaseAuth())
        mockDatabaseManager = MockDatabaseManager(FirebaseProvider.getFirebaseFirestore())
        versionCodeDocument = FirebaseTestUtil.mockDocument()
        mockSnapshot = FirebaseTestUtil.mockSnapshot()

        // Initialize Firebase mock return values (Must happen *before* starting the activity)
        val collectionMap = FirebaseTestUtil.initializeCollectionMap(
            listOf(
                PathConstants.USER_COLLECTION_PATH,
                PathConstants.GLOBAL_DATA_COLLECTION_PATH
            )
        )

        //val mockAuthManager = MockAuthManager()
        mockAuthManager!!.useNoOneSignedIn()

        // val mockDatabaseManager = MockDatabaseManager()
        FirebaseTestUtil.whenGetCollectionThenReturn(
            mockDatabaseManager!!.getMockFirestore(),
            collectionMap
        )
        FirebaseTestUtil.whenGetDocumentThenReturn(
            collectionMap[PathConstants.GLOBAL_DATA_COLLECTION_PATH]!!,
            PathConstants.GLOBAL_DATA_FIELD__VERSION_CODE,
            versionCodeDocument!!
        )
        FirebaseTestUtil.onAddSnapshotListener(versionCodeDocument!!, mockSnapshot!!)
    }

    @After
    fun tearDown() {
        helper.tearDownTestEnvironment()
    }

    @Test
    fun showsForceUpgradeScreen() {
        every { mockSnapshot!!.exists() } returns true
        every { mockSnapshot!!.getLong(PathConstants.GLOBAL_DATA_FIELD__ANDROID_APP_VERSION_CODE) } returns MINIMUM_SUPPORTED_APP_VERSION

        startApp()

        verify { mockSnapshot!!.getLong(PathConstants.GLOBAL_DATA_FIELD__ANDROID_APP_VERSION_CODE) }
        onView(withId(R.id.force_upgrade_message)).check(matches(isDisplayed()))
    }

    @Test
    fun doesNotShowForeUpgradeScreen() {
        every { mockSnapshot!!.exists() } returns true
        every { mockSnapshot!!.getLong(PathConstants.GLOBAL_DATA_FIELD__ANDROID_APP_VERSION_CODE) } returns -10L

        startApp()

        verify { mockSnapshot!!.getLong(PathConstants.GLOBAL_DATA_FIELD__ANDROID_APP_VERSION_CODE) }
        onView(withId(R.id.sign_in_button)).check(matches(isDisplayed()))
    }

    private fun startApp() {
        activityRule.launchActivity(null)
    }
}