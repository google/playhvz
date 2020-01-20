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

package com.app.playhvz.screens.signin

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.ProgressBar
import android.widget.Toast
import com.app.playhvz.R
import com.app.playhvz.app.BaseActivity
import com.app.playhvz.app.EspressoIdlingResource
import com.app.playhvz.firebase.firebaseprovider.FirebaseProvider
import com.app.playhvz.firebase.operations.GlobalDatabaseOperations
import com.app.playhvz.firebase.operations.UserDatabaseOperations
import com.app.playhvz.firebase.utils.FirebaseDatabaseUtil
import com.app.playhvz.notifications.NotificationUtil
import com.app.playhvz.screens.MainActivity
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.android.synthetic.main.activity_signin.*
import kotlinx.coroutines.runBlocking


class SignInActivity : BaseActivity() {

    // All static methods or variables go inside this companion object.
    companion object {
        private val TAG = SignInActivity::class.qualifiedName
        private val EXTRA_SIGNOUT = "signout"
        val GOOGLE_SIGN_IN_REQUEST_CODE: Int = 1

        fun getLaunchIntent(from: Context, signOut: Boolean) =
            Intent(from, SignInActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK).putExtra(
                    EXTRA_SIGNOUT,
                    signOut
                )
            }
    }

    lateinit var mGoogleSignInClient: GoogleSignInClient
    lateinit var mGoogleSignInOptions: GoogleSignInOptions

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_signin)
        configureGoogleSignIn()
        sign_in_button.setOnClickListener {
            signIn()
        }
        FirebaseDatabaseUtil.initFirebaseDatabase()
    }

    /**
     * Once the activity starts we need to check some status things before we unlock the app for the
     * user. Notably:
     *  1.) Check if the user requested a Sign Out and sign them out if so.
     *  2.) Check app version against supported app versions. Disable the app if it fails the check.
     *  3.) Check if the user is already signed in and lead them to the home activity.
     *
     *  Proceed to sign in screen after these checks.
     */
    override fun onStart() {
        super.onStart()
        if (intent.getBooleanExtra(EXTRA_SIGNOUT, false)) {
            signOut()
        }

        GlobalDatabaseOperations.listenForForceUpgrade(applicationContext)

        // Redirect to the home screen if we're already signed in.
        val user = FirebaseProvider.getFirebaseAuth().currentUser
        if (user != null) {
            showLoadingSpinner()
            ensureUserSetUpBeforeNavigatingToHomePage()
        }
    }

    private fun configureGoogleSignIn() {
        mGoogleSignInOptions = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        mGoogleSignInClient = GoogleSignIn.getClient(this, mGoogleSignInOptions)
    }

    private fun signIn() {
        val signInIntent: Intent = mGoogleSignInClient.signInIntent
        startActivityForResult(signInIntent, GOOGLE_SIGN_IN_REQUEST_CODE)
    }

    fun signOut() {
        EspressoIdlingResource.increment()
        NotificationUtil.unregisterDeviceFromCurrentUser()
        // Sign out of both Firebase & Google. If we only sign out of Firebase, then when we try to
        // sign back in, Google uses the same account and we can't see the account picker.
        FirebaseProvider.getFirebaseAuth().signOut()
        mGoogleSignInClient.signOut()
        EspressoIdlingResource.decrement()
    }

    /** Listens for results from Google signing in. */
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        Log.d(TAG, "lizard got result")
        EspressoIdlingResource.increment()
        // Result returned from launching the Intent from GoogleSignInApi.getSignInIntent(...);
        if (requestCode == GOOGLE_SIGN_IN_REQUEST_CODE) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            try {
                // Google Sign In was successful, authenticate with Firebase
                val account = task.getResult(ApiException::class.java)
                firebaseAuthWithGoogle(account!!)
            } catch (e: ApiException) {
                // The ApiException status code indicates the detailed failure reason.
                // Please refer to the GoogleSignInStatusCodes class reference for more information.
                Log.w(TAG, "signInResult:failed code=" + e.statusCode)
                Toast.makeText(
                    applicationContext,
                    getString(R.string.sign_in_failed_toast),
                    Toast.LENGTH_SHORT
                ).show()
            } finally {
                EspressoIdlingResource.decrement()
            }
        }
    }

    /**
     * Authenticates to Firebase using Google as the sign in method. Note, the user has already
     * signed in using Google at this point, we're just asking Google to verify their credentials
     * so Firebase believes who they say they are.
     */
    private fun firebaseAuthWithGoogle(acct: GoogleSignInAccount) {
        val credential = GoogleAuthProvider.getCredential(acct.idToken, null)
        EspressoIdlingResource.increment()
        FirebaseProvider.getFirebaseAuth()
            .signInWithCredential(credential)
            .addOnCompleteListener {
                if (it.isSuccessful) {
                    Toast.makeText(this, "Signed in successfully!", Toast.LENGTH_LONG).show()
                    showLoadingSpinner()
                    ensureUserSetUpBeforeNavigatingToHomePage()
                } else {
                    Toast.makeText(this, "Google sign in failed:(", Toast.LENGTH_LONG).show()
                }
                EspressoIdlingResource.decrement()
            }
    }

    private fun ensureUserSetUpBeforeNavigatingToHomePage() {
        val context = this
        // Active coroutine counter
        runBlocking {
            EspressoIdlingResource.increment()
            UserDatabaseOperations.asyncEnsureUserInDatabase() {
                // Now that we have a valid user, try registering the device for notifications.
                NotificationUtil.registerDeviceForNotifications()
                startActivity(MainActivity.getLaunchIntent(context))
                finish()
                EspressoIdlingResource.decrement()
            }
        }
    }

    private fun showLoadingSpinner() {
        findViewById<ProgressBar>(R.id.sign_in_loading_spinner).visibility = View.VISIBLE
        findViewById<View>(R.id.sign_in_header).visibility = View.GONE
        findViewById<View>(R.id.sign_in_image).visibility = View.GONE
        findViewById<View>(R.id.sign_in_button).visibility = View.GONE
    }
}