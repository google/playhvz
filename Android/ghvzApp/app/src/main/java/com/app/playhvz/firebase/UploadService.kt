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

package com.app.playhvz.firebase

import android.graphics.Bitmap
import android.net.Uri
import android.util.Log
import com.app.playhvz.firebase.classmodels.Player
import com.google.android.gms.tasks.Task
import com.google.firebase.ktx.Firebase
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.UploadTask
import com.google.firebase.storage.ktx.storage
import java.io.ByteArrayOutputStream
import java.util.*

class UploadService {
    companion object {
        private val TAG = UploadService::class.qualifiedName
        val IMAGE_DIRECTORY_NAME = "images"
        val HUMAN_READABLE_SLASH = "/"
        val URL_SLASH = "%2F"
        val FILE_TYPE = ".jpg"

        val PROFILE_TAG = "profile_"
        val REWARD_TAG = "reward_"
        val MESSAGE_TAG = "message_"

        fun getProfileImageName(player: Player): String {
            return PROFILE_TAG + player.userId + "_" + player.id
        }

        fun getRewardImageName(): String {
            return REWARD_TAG + UUID.randomUUID().toString()
        }

        fun getMessageImageName(): String {
            return MESSAGE_TAG + UUID.randomUUID().toString()
        }

        fun parseRewardImageNameFromExistingFirebaseUrl(url: String): String {
            val regex = Regex(IMAGE_DIRECTORY_NAME + URL_SLASH + REWARD_TAG + ".*" + FILE_TYPE)
            val result = regex.find(url, /* startIndex= */ 0)
            if (result == null || result.groupValues.isEmpty()) {
                // Couldn't parse URL, just make a new reward file name
                return getRewardImageName()
            }
            return REWARD_TAG + result.groupValues[0]
        }
    }

    private val storage: FirebaseStorage = Firebase.storage

    fun uploadBitmap(bitmap: Bitmap, name: String, urlCallback: ((url: Uri?) -> Unit)? = null) {
        val storageRef = storage.reference
        val pathReference =
            storageRef.child(IMAGE_DIRECTORY_NAME + HUMAN_READABLE_SLASH + name + FILE_TYPE)

        val baos = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, baos)
        val data = baos.toByteArray()

        val uploadTask = pathReference.putBytes(data)
        uploadTask.continueWithTask { task: Task<UploadTask.TaskSnapshot> ->
            if (!task.isSuccessful) {
                Log.e(TAG, "Failed to upload image: ${task.exception}")
            }
            pathReference.downloadUrl
        }.addOnCompleteListener { task: Task<Uri> ->
            if (task.isSuccessful) {
                if (urlCallback != null) {
                    val downloadUri = task.result
                    urlCallback.invoke(downloadUri)
                }
            } else {
                Log.e(TAG, "Failed to get image download uri: ${task.exception}")
            }
        }
    }
}