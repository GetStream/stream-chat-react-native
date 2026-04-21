package com.streamchatreactnative.shared.upload

import android.os.SystemClock
import okhttp3.RequestBody
import okio.Buffer
import okio.BufferedSink
import okio.ForwardingSink
import okio.Sink
import okio.buffer
import kotlin.math.floor

class StreamMultipartUploadProgressThrottler(
  options: StreamMultipartUploadProgressOptions?,
  private val onProgress: (loaded: Long, total: Long?) -> Unit,
) {
  private val intervalMs = options?.intervalMs ?: 16L
  private val count = options?.count ?: 20
  private var emittedBuckets = -1
  private var lastEventAtMs = 0L

  fun dispatch(loaded: Long, total: Long?) {
    val now = SystemClock.elapsedRealtime()
    val isTerminal = total != null && total >= 0 && loaded >= total

    if (isTerminal) {
      onProgress(loaded, total)
      return
    }

    val passesInterval = now - lastEventAtMs >= intervalMs
    val passesCount =
      if (count > 0 && total != null && total > 0) {
        val nextBucket = floor((loaded.toDouble() / total.toDouble()) * count.toDouble()).toInt()
        if (nextBucket > emittedBuckets) {
          emittedBuckets = nextBucket
          true
        } else {
          false
        }
      } else {
        true
      }

    if (!passesInterval || !passesCount) {
      return
    }

    lastEventAtMs = now
    onProgress(loaded, total)
  }
}

class StreamMultipartUploadProgressRequestBody(
  private val requestBody: RequestBody,
  private val throttler: StreamMultipartUploadProgressThrottler,
) : RequestBody() {
  override fun contentLength(): Long = requestBody.contentLength()

  override fun contentType() = requestBody.contentType()

  override fun writeTo(sink: BufferedSink) {
    val countingSink =
      object : ForwardingSink(sink as Sink) {
        private var bytesWritten = 0L

        override fun write(source: Buffer, byteCount: Long) {
          super.write(source, byteCount)

          bytesWritten += byteCount
          val total = requestBody.contentLength().takeIf { it >= 0L }
          throttler.dispatch(bytesWritten, total)
        }
      }

    val bufferedSink = countingSink.buffer()
    requestBody.writeTo(bufferedSink)
    bufferedSink.flush()
  }
}
