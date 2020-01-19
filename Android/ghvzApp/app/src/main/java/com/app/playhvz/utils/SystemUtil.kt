package com.app.playhvz.utils

import android.content.Context
import android.view.inputmethod.InputMethodManager
import androidx.core.content.pm.PackageInfoCompat

/** Util for common system functions. */
class SystemUtil {

    companion object {
        private val TAG = SystemUtil::class.qualifiedName

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
    }
}