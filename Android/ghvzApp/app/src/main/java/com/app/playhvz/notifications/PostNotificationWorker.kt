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


import android.content.Context
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters

class PostNotificationWorker(appContext: Context, workerParams: WorkerParameters) : Worker(appContext, workerParams) {
    companion object {
        private val TAG = PostNotificationWorker::class.qualifiedName
    }

    override fun doWork(): Result {
        Log.d(TAG, "Performing long running task in scheduled job")
        // TODO(developer): add long running task here.
        return Result.success()
    }
}