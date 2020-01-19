package com.app.playhvz.utils

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.app.playhvz.R

/** Util for handling logic based on Android version. */
class CompatUtil {

    // All static methods or variables go inside this companion object.
    companion object {
        private val TAG = CompatUtil::class.qualifiedName

        fun buildNotificationChannel(context: Context, notificationManager: NotificationManager, channelId: String) {
            // Android Oreo and later supports notification channels.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(channelId,
                        context.getString(R.string.default_notification_channel_name),
                        NotificationManager.IMPORTANCE_DEFAULT)
                notificationManager.createNotificationChannel(channel)
            }
        }
    }
}