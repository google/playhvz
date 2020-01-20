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

package com.app.playhvz.firebase.operations

import android.content.Context
import android.util.Log
import com.app.playhvz.app.PlayHvzApplication
import com.app.playhvz.firebase.constants.PathConstants
import com.app.playhvz.firebase.utils.FirebaseDatabaseUtil
import com.app.playhvz.screens.forceupgrade.ForceUpgradeActivity
import com.app.playhvz.screens.signin.SignInActivity
import com.app.playhvz.utils.SystemUtil


class GlobalDatabaseOperations {
    companion object {
        private val TAG = FirebaseDatabaseUtil::class.qualifiedName

        fun listenForForceUpgrade(context: Context) {
            PathConstants.VERSION_CODE_DOCREF()
                .addSnapshotListener { snapshot, e ->
                    if (e != null) {
                        Log.w(TAG, "Listen failed.", e)
                        return@addSnapshotListener
                    }
                    if (snapshot != null && snapshot.exists()) {
                        val supportedAppVersionCode =
                            snapshot.getLong(PathConstants.GLOBAL_DATA_FIELD__ANDROID_APP_VERSION_CODE)
                        if (supportedAppVersionCode != null && SystemUtil.getAppVersion(context) < supportedAppVersionCode) {
                            Log.w(TAG, "App version out of date, opening force upgrade activity")
                            context.startActivity(ForceUpgradeActivity.getLaunchIntent(context))
                        } else if ((context as PlayHvzApplication).currentActivity is ForceUpgradeActivity) {
                            // We're showing the force upgrade activity to an app that has a valid
                            // version code. Redirect to SignInActivity.
                            Log.w(TAG, "App version valid, redirecting to signin activity")
                            context.startActivity(
                                SignInActivity.getLaunchIntent(
                                    context,
                                    /* signOut= */ false
                                )
                            )
                        }
                    }
                }
        }

    }
}