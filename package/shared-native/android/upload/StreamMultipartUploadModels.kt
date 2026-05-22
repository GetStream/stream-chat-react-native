package com.streamchatreactnative.shared.upload

data class StreamMultipartUploadRequest(
  val headers: Map<String, String>,
  val method: String,
  val parts: List<StreamMultipartUploadPart>,
  val progress: StreamMultipartUploadProgressOptions?,
  val timeoutMs: Long?,
  val uploadId: String,
  val url: String,
)

sealed interface StreamMultipartUploadPart {
  val fieldName: String
}

data class StreamMultipartFilePart(
  override val fieldName: String,
  val fileName: String,
  val mimeType: String?,
  val uri: String,
) : StreamMultipartUploadPart

data class StreamMultipartTextPart(
  override val fieldName: String,
  val value: String,
) : StreamMultipartUploadPart

data class StreamMultipartUploadProgressOptions(
  val count: Int?,
  val intervalMs: Long?,
)

data class StreamMultipartUploadResponse(
  val body: String,
  val headers: Map<String, String>,
  val status: Int,
  val statusText: String?,
)
