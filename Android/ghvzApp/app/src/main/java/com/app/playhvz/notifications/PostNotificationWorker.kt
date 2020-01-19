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