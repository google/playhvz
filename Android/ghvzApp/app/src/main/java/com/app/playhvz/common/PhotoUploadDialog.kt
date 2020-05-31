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

package com.app.playhvz.common

import android.Manifest.permission.READ_EXTERNAL_STORAGE
import android.app.Activity.RESULT_OK
import android.app.AlertDialog
import android.app.Dialog
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.core.app.ActivityCompat
import androidx.fragment.app.DialogFragment
import com.app.playhvz.R
import com.app.playhvz.firebase.UploadService
import com.app.playhvz.utils.CompatUtils.Companion.uriToBitmap
import com.app.playhvz.utils.ImageDownloaderUtils
import com.app.playhvz.utils.ImageDownloaderUtils.Companion.PICK_IMAGE_REQUEST_CODE
import com.app.playhvz.utils.ImageDownloaderUtils.Companion.READ_EXTERNAL_STORAGE_REQUEST_CODE
import com.google.android.material.button.MaterialButton

class PhotoUploadDialog(
    private val fileName: String,
    private val url: String? = null,
    private val uploadedUrlCallback: ((url: Uri?) -> Unit)?
) :
    DialogFragment() {

    companion object {
        private val TAG = PhotoUploadDialog::class.qualifiedName
    }

    private lateinit var customView: View
    private lateinit var imageView: ImageView
    var onConfirm: (() -> Unit)? = null
    var onCancel: (() -> Unit)? = null
    private var currentBitmap: Bitmap? = null

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        customView = requireActivity().layoutInflater.inflate(R.layout.dialog_photo_upload, null)
        imageView = customView.findViewById(R.id.image)

        imageView.setOnClickListener {
            openImageGallery()
        }

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle(R.string.photo_upload_dialog_title)
            .setView(customView)
            .create()

        val positiveButton = customView.findViewById<MaterialButton>(R.id.positive_button)
        positiveButton.setText(R.string.button_set)
        positiveButton.setOnClickListener {
            if (currentBitmap != null) {
                val uploadService: UploadService = UploadService()
                uploadService.uploadBitmap(currentBitmap!!, fileName, uploadedUrlCallback)
            }
            onConfirm?.invoke()
            dialog?.dismiss()
        }
        val negativeButton = customView.findViewById<MaterialButton>(R.id.negative_button)
        negativeButton.setText(R.string.button_cancel)
        negativeButton.setOnClickListener {
            onCancel?.invoke()
            dialog?.dismiss()
        }
        return dialog
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        if (url != null) {
            updateDisplayedImage()
        }
        // Return already inflated custom view
        return customView
    }

    override fun onActivityResult(
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (resultCode != RESULT_OK) {
            return
        }
        when (requestCode) {
            PICK_IMAGE_REQUEST_CODE -> if (resultCode == RESULT_OK && data != null) {
                val selectedImageUri: Uri? = data.data
                if (selectedImageUri != null) {
                    val imageBitmap = uriToBitmap(requireContext(), selectedImageUri)
                    currentBitmap = imageBitmap
                    imageView.setImageBitmap(imageBitmap)
                }
            }
        }
    }

    fun setPositiveButtonCallback(okayCallback: () -> Unit) {
        onConfirm = okayCallback
    }

    fun setNegativeButtonCallback(negativeCallback: () -> Unit) {
        onCancel = negativeCallback
    }

    private fun updateDisplayedImage() {
        if (url.isNullOrBlank()) {
            return
        }
        ImageDownloaderUtils.downloadSquareImage(imageView, url!!)
    }

    private fun openImageGallery() {
        if (ActivityCompat.checkSelfPermission(
                requireContext(),
                READ_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            val intent = Intent(
                Intent.ACTION_PICK,
                MediaStore.Images.Media.INTERNAL_CONTENT_URI
            )
            intent.type = "image/*"
            intent.putExtra("crop", "true")
            intent.putExtra("scale", true)
            intent.putExtra("aspectX", 16)
            intent.putExtra("aspectY", 9)
            startActivityForResult(intent, PICK_IMAGE_REQUEST_CODE)
        } else {
            ActivityCompat.requestPermissions(
                requireActivity(),
                arrayOf(READ_EXTERNAL_STORAGE),
                READ_EXTERNAL_STORAGE_REQUEST_CODE
            )
        }
    }
}