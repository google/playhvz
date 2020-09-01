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

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.widget.TimePicker
import com.app.playhvz.R

/** Util for handling logic based on Android version. */
class CompatUtils {

    // All static methods or variables go inside this companion object.
    @Suppress("DEPRECATION")
    companion object {
        private val TAG = CompatUtils::class.qualifiedName

        fun buildNotificationChannel(
            context: Context,
            notificationManager: NotificationManager,
            channelId: String
        ) {
            // Android Oreo and later supports notification channels.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    channelId,
                    context.getString(R.string.default_notification_channel_name),
                    NotificationManager.IMPORTANCE_DEFAULT
                )
                notificationManager.createNotificationChannel(channel)
            }
        }

        fun getHour(timePicker: TimePicker): Int {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                timePicker.hour
            } else {
                timePicker.currentHour
            }
        }

        fun setHour(timePicker: TimePicker, hour: Int) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                timePicker.hour = hour
            } else {
                timePicker.currentHour = hour
            }
        }

        fun getMinute(timePicker: TimePicker): Int {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                timePicker.minute
            } else {
                timePicker.currentMinute
            }
        }

        fun setMinute(timePicker: TimePicker, minute: Int) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                timePicker.minute = minute
            } else {
                timePicker.currentMinute = minute
            }
        }

        fun uriToBitmap(context: Context, uri: Uri): Bitmap {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ImageDecoder.decodeBitmap(
                    ImageDecoder.createSource(
                        context.contentResolver,
                        uri
                    )
                )
            } else {
                MediaStore.Images.Media.getBitmap(context.contentResolver, uri)
            }
        }
    }
}