package com.streamchatexpo

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.streamchatreactnative.shared.upload.StreamMultipartUploadRequestParser
import com.streamchatreactnative.shared.upload.StreamMultipartUploader
import java.util.concurrent.Executors

class StreamMultipartUploaderModule(
  reactContext: ReactApplicationContext,
) : NativeStreamMultipartUploaderSpec(reactContext) {
  override fun getName(): String = NAME

  override fun addListener(eventType: String) = Unit

  override fun removeListeners(count: Double) = Unit

  override fun cancelUpload(uploadId: String, promise: Promise) {
    StreamMultipartUploader.cancel(uploadId)
    promise.resolve(null)
  }

  override fun uploadMultipart(
    uploadId: String,
    url: String,
    method: String,
    headers: ReadableArray,
    parts: ReadableArray,
    progress: com.facebook.react.bridge.ReadableMap?,
    promise: Promise,
  ) {
    executor.execute {
      try {
        val request = StreamMultipartUploadRequestParser.parse(
          uploadId = uploadId,
          url = url,
          method = method,
          headers = headers,
          parts = parts,
          progress = progress,
        )
        val response =
          StreamMultipartUploader.upload(reactApplicationContext, request) { loaded, total ->
            emitProgress(uploadId, loaded, total)
          }

        val payload = Arguments.createMap().apply {
          putString("body", response.body)
          putArray("headers", Arguments.createArray().apply {
            response.headers.forEach { (name, value) ->
              pushMap(
                Arguments.createMap().apply {
                  putString("name", name)
                  putString("value", value)
                },
              )
            }
          })
          putDouble("status", response.status.toDouble())
          putString("statusText", response.statusText)
        }
        promise.resolve(payload)
      } catch (error: Throwable) {
        promise.reject("stream_multipart_upload_error", error.message, error)
      }
    }
  }

  private fun emitProgress(uploadId: String, loaded: Long, total: Long?) {
    val payload = Arguments.createMap().apply {
      putDouble("loaded", loaded.toDouble())
      if (total != null) {
        putDouble("total", total.toDouble())
      } else {
        putNull("total")
      }
      putString("uploadId", uploadId)
    }

    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(PROGRESS_EVENT_NAME, payload)
  }

  companion object {
    const val NAME = "StreamMultipartUploader"
    private const val PROGRESS_EVENT_NAME = "streamMultipartUploadProgress"
    private val executor = Executors.newCachedThreadPool()
  }
}
