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

        fun getProfileImageName(player: Player): String {
            return "profile_" + player.userId + "_" + player.id
        }

        fun getRewardImageName(): String {
            return "reward_" + UUID.randomUUID().toString()
        }

        fun getMessageImageName(): String {
            return "message_" + UUID.randomUUID().toString()
        }
    }

    private val storage: FirebaseStorage = Firebase.storage

    fun uploadBitmap(bitmap: Bitmap, name: String, urlCallback: ((url: Uri?) -> Unit)? = null) {
        val storageRef = storage.reference
        val pathReference = storageRef.child("images/$name.jpg")

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