package com.streamchatreactnative.shared.upload

import android.content.Context
import okhttp3.Call
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.ResponseBody
import java.io.InterruptedIOException
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

object StreamMultipartUploader {
  private val client: OkHttpClient = OkHttpClient.Builder().retryOnConnectionFailure(true).build()
  private const val MAX_RESPONSE_BODY_BYTES = 1_048_576L
  private val cancelledUploadIds = ConcurrentHashMap.newKeySet<String>()
  private val inFlightCalls = ConcurrentHashMap<String, Call>()

  fun cancel(uploadId: String) {
    cancelledUploadIds.add(uploadId)
    inFlightCalls.remove(uploadId)?.cancel()
  }

  fun upload(
    context: Context,
    request: StreamMultipartUploadRequest,
    onProgress: (loaded: Long, total: Long?) -> Unit,
  ): StreamMultipartUploadResponse {
    if (cancelledUploadIds.contains(request.uploadId)) {
      cancelledUploadIds.remove(request.uploadId)
      throw InterruptedIOException("Request aborted")
    }

    val httpRequest = createRequest(context, request, onProgress)
    val call = clientFor(request).newCall(httpRequest)
    inFlightCalls[request.uploadId] = call

    try {
      if (cancelledUploadIds.remove(request.uploadId)) {
        call.cancel()
      }

      call.execute().use { response ->
        return StreamMultipartUploadResponse(
          body = readResponseBody(response.body),
          headers =
            response.headers.names().associateWith { name ->
              response.headers(name).joinToString(", ")
            },
          status = response.code,
          statusText = response.message,
        )
      }
    } finally {
      inFlightCalls.remove(request.uploadId)
      cancelledUploadIds.remove(request.uploadId)
    }
  }

  private fun clientFor(request: StreamMultipartUploadRequest): OkHttpClient {
    val timeoutMs = request.timeoutMs ?: return client
    return client.newBuilder()
      .callTimeout(timeoutMs, TimeUnit.MILLISECONDS)
      .build()
  }

  private fun readResponseBody(body: ResponseBody?): String {
    if (body == null) {
      return ""
    }

    val source = body.source()
    source.request(MAX_RESPONSE_BODY_BYTES + 1L)
    val buffer = source.buffer

    if (buffer.size > MAX_RESPONSE_BODY_BYTES) {
      throw IOException("Upload response body exceeded $MAX_RESPONSE_BODY_BYTES bytes")
    }

    return buffer.clone().readString(Charsets.UTF_8)
  }

  private fun createMultipartBody(
    context: Context,
    request: StreamMultipartUploadRequest,
    onProgress: (loaded: Long, total: Long?) -> Unit,
  ): RequestBody {
    val multipartBodyBuilder = MultipartBody.Builder().setType(MultipartBody.FORM)

    request.parts.forEach { part ->
      when (part) {
        is StreamMultipartFilePart -> {
          multipartBodyBuilder.addFormDataPart(
            part.fieldName,
            part.fileName,
            StreamMultipartUploadFileRequestBody(context, part),
          )
        }

        is StreamMultipartTextPart -> {
          multipartBodyBuilder.addFormDataPart(part.fieldName, part.value)
        }
      }
    }

    val multipartBody = multipartBodyBuilder.build()
    val throttler = StreamMultipartUploadProgressThrottler(request.progress, onProgress)

    return StreamMultipartUploadProgressRequestBody(multipartBody, throttler)
  }

  private fun createRequest(
    context: Context,
    request: StreamMultipartUploadRequest,
    onProgress: (loaded: Long, total: Long?) -> Unit,
  ): Request {
    val requestBuilder = Request.Builder().url(request.url)

    request.headers.forEach { (key, value) ->
      if (
        key.equals("Content-Type", ignoreCase = true) ||
          key.equals("Content-Length", ignoreCase = true)
      ) {
        return@forEach
      }

      requestBuilder.header(key, value)
    }

    val body = createMultipartBody(context, request, onProgress)
    return requestBuilder.method(request.method, body).build()
  }
}
