package com.streamchatreactnative.shared.upload

import android.content.Context
import okhttp3.RequestBody
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okio.BufferedSink
import okio.source

class StreamMultipartUploadFileRequestBody(
  private val context: Context,
  private val filePart: StreamMultipartFilePart,
) : RequestBody() {
  private val resolvedMimeType = StreamMultipartUploadSourceResolver.mimeType(context, filePart)
  private val resolvedContentLength = StreamMultipartUploadSourceResolver.contentLength(context, filePart.uri)

  override fun contentLength(): Long = resolvedContentLength ?: -1L

  override fun contentType() = resolvedMimeType.toMediaTypeOrNull()

  override fun writeTo(sink: BufferedSink) {
    StreamMultipartUploadSourceResolver.openInputStream(context, filePart.uri).use { inputStream ->
      sink.writeAll(inputStream.source())
    }
  }
}
