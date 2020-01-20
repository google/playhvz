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

package com.app.playhvz.notifications

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.media.RingtoneManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.app.playhvz.R
import com.app.playhvz.firebase.operations.UserDatabaseOperations
import com.app.playhvz.screens.signin.SignInActivity
import com.app.playhvz.utils.CompatUtil
import com.google.android.gms.tasks.OnCompleteListener
import com.google.firebase.iid.FirebaseInstanceId

class NotificationUtil {

    companion object {
        private val TAG = NotificationUtil::class.qualifiedName

        fun registerDeviceForNotifications() {
            FirebaseInstanceId.getInstance().instanceId
                .addOnCompleteListener(OnCompleteListener { task ->
                    if (!task.isSuccessful) {
                        Log.w(TAG, "getInstanceId failed", task.exception)
                        return@OnCompleteListener
                    }
                    // Log new InstanceID token
                    val token = task.result?.token
                    Log.d(TAG, "Got token: $token")
                    registerDeviceToCurrentUser(token)
                })
        }

        /**
         * Persist given Firebase messaging InstanceID token to user's account in Firebase.
         */
        fun registerDeviceToCurrentUser(token: String?) {
            UserDatabaseOperations.registerDeviceToCurrentUser(token)
        }

        /**
         * Persist given Firebase messaging InstanceID token to user's account in Firebase.
         */
        fun unregisterDeviceFromCurrentUser() {
            UserDatabaseOperations.unregisterDeviceFromCurrentUser()
        }

        /**
         * Create and show a simple notification containing the received FCM message.
         *
         * @param messageBody FCM message body received.
         */
        fun sendNotification(context: Context, messageBody: String) {
            val intent = SignInActivity.getLaunchIntent(context, /* signOut= */ false)
            val pendingIntent = PendingIntent.getActivity(
                context, 0 /* Request code */, intent,
                PendingIntent.FLAG_ONE_SHOT
            )

            val channelId = context.getString(R.string.default_notification_channel_id)
            val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val notificationBuilder = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.mipmap.ic_launcher_round)
                .setContentTitle(context.getString(R.string.default_notification_title))
                .setContentText(messageBody)
                .setAutoCancel(true)
                .setSound(defaultSoundUri)
                .setContentIntent(pendingIntent)

            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            CompatUtil.buildNotificationChannel(context, notificationManager, channelId)

            notificationManager.notify(0 /* ID of notification */, notificationBuilder.build())
        }
    }
}