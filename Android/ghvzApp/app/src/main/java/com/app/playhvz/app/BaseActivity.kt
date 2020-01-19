package com.app.playhvz.app

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

open class BaseActivity : AppCompatActivity() {

    private lateinit var app: PlayHvzApplication

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState);
        app = applicationContext as PlayHvzApplication
    }

    override fun onResume() {
        super.onResume()
        app.currentActivity = this
    }

    override fun onPause() {
        clearReferences()
        super.onPause()
    }

    override fun onDestroy() {
        clearReferences()
        super.onDestroy()
    }

    private fun clearReferences() {
        val currentActivity = app.currentActivity
        if (this == currentActivity) {
            app.currentActivity = null
        }
    }
}