package com.streamchatreactnative

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.streamchatreactnative.shared.StreamVideoThumbnailGenerator
import java.util.concurrent.Executors

class StreamVideoThumbnailModule(
  reactContext: ReactApplicationContext,
) : NativeStreamVideoThumbnailSpec(reactContext) {
  override fun getName(): String = NAME

  override fun createVideoThumbnails(urls: ReadableArray, promise: Promise) {
    val urlList = mutableListOf<String>()
    for (index in 0 until urls.size()) {
      urlList.add(urls.getString(index) ?: "")
    }

    executor.execute {
      try {
        val thumbnails = StreamVideoThumbnailGenerator.generateThumbnails(reactApplicationContext, urlList)
        val result = Arguments.createArray()
        thumbnails.forEach(result::pushString)
        promise.resolve(result)
      } catch (error: Throwable) {
        promise.reject("stream_video_thumbnail_error", error.message, error)
      }
    }
  }

  companion object {
    const val NAME = "StreamVideoThumbnail"
    private val executor = Executors.newCachedThreadPool()
  }
}
