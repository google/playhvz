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

package com.app.playhvz.testutils.firebase

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import io.mockk.every
import io.mockk.mockkClass

class MockAuthManager(val mockFirebaseAuth: FirebaseAuth) {
    val USER_ID = "1234"

    private val mockFirebaseUser: FirebaseUser = mockkClass(FirebaseUser::class)

    fun getMockAuth(): FirebaseAuth {
        return mockFirebaseAuth
    }

    fun getMockUser(): FirebaseUser {
        return mockFirebaseUser
    }

    fun useSignedInUser() {
        initUser()
        every { mockFirebaseAuth.uid } returns USER_ID
        every { mockFirebaseAuth.currentUser } returns mockFirebaseUser
    }

    fun useNoOneSignedIn() {
        every { mockFirebaseAuth.currentUser } returns null
    }

    /** Creates a fake user and makes sure that user is returned as the current user by FirebaseAuth. */
    private fun initUser() {
        every { mockFirebaseUser.uid } returns USER_ID
    }
}