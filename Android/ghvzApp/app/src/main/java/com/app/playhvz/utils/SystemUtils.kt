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

package com.app.playhvz.utils

import android.app.Activity
import android.content.Context
import android.view.inputmethod.InputMethodManager
import android.widget.Toast
import androidx.core.content.pm.PackageInfoCompat
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.CURRENT_GAME_ID
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.CURRENT_PLAYER_ID
import com.app.playhvz.common.globals.SharedPreferencesConstants.Companion.PREFS_FILENAME

/** Util for common system functions. */
class SystemUtils {

    companion object {
        private val TAG = SystemUtils::class.qualifiedName

        /** Returns the app version code as a Long. */
        fun getAppVersion(context: Context): Long {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            return PackageInfoCompat.getLongVersionCode(packageInfo)
        }

        fun hideKeyboard(context: Context) {
            val inputManager =
                context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            inputManager.toggleSoftInput(InputMethodManager.HIDE_IMPLICIT_ONLY, 0)
        }

        fun showToast(context: Context?, message: String) {
            Toast.makeText(
                context,
                message,
                Toast.LENGTH_LONG
            ).show()
        }

        fun clearSharedPrefs(activity: Activity) {
            val editor = activity.getSharedPreferences(PREFS_FILENAME, 0)!!.edit()
            editor.putString(CURRENT_GAME_ID, null)
            editor.putString(CURRENT_PLAYER_ID, null)
            editor.apply()
        }
    }
}