package com.app.playhvz.screens.forceupgrade

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.app.playhvz.R
import com.app.playhvz.app.BaseActivity
import kotlinx.android.synthetic.main.activity_force_upgrade.*

class ForceUpgradeActivity : BaseActivity() {

    companion object {
        private val TAG = ForceUpgradeActivity::class.qualifiedName

        fun getLaunchIntent(from: Context) = Intent(from, ForceUpgradeActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_force_upgrade)

        force_upgrade_button.setOnClickListener {
            val appPackageName = packageName
            try {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$appPackageName")))
            } catch (anfe: android.content.ActivityNotFoundException) {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$appPackageName")))
            }
        }
    }
}