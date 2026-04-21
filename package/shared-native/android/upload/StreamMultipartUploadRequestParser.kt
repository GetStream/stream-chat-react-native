package com.streamchatreactnative.shared.upload

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

object StreamMultipartUploadRequestParser {
  fun parse(
    uploadId: String,
    url: String,
    method: String,
    headers: ReadableArray,
    parts: ReadableArray,
    progress: ReadableMap?,
  ): StreamMultipartUploadRequest {
    return StreamMultipartUploadRequest(
      headers = headers.toStringMap(),
      method = method,
      parts = parts.toUploadParts(),
      progress = progress?.toProgressOptions(),
      uploadId = uploadId,
      url = url,
    )
  }

  private fun ReadableArray.toUploadParts(): List<StreamMultipartUploadPart> {
    val parsedParts = mutableListOf<StreamMultipartUploadPart>()

    for (index in 0 until size()) {
      val part = getMap(index) ?: throw IllegalArgumentException("Missing multipart part at index $index")
      val fieldName =
        part.getString("fieldName") ?: throw IllegalArgumentException("Multipart part $index is missing fieldName")
      val kind =
        part.getString("kind") ?: throw IllegalArgumentException("Multipart part $index is missing kind")

      when (kind) {
        "file" -> {
          val uri =
            part.getString("uri") ?: throw IllegalArgumentException("Multipart file part $index is missing uri")
          val fileName =
            part.getString("fileName")
              ?: throw IllegalArgumentException("Multipart file part $index is missing fileName")

          parsedParts += StreamMultipartFilePart(
            fieldName = fieldName,
            fileName = fileName,
            mimeType = part.getString("mimeType"),
            uri = uri,
          )
        }

        "text" -> {
          val value =
            part.getString("value") ?: throw IllegalArgumentException("Multipart text part $index is missing value")
          parsedParts += StreamMultipartTextPart(fieldName = fieldName, value = value)
        }

        else -> throw IllegalArgumentException("Unsupported multipart part kind: $kind")
      }
    }

    if (parsedParts.none { it is StreamMultipartFilePart }) {
      throw IllegalArgumentException("Multipart upload must contain at least one file part")
    }

    return parsedParts
  }

  private fun ReadableArray.toStringMap(): Map<String, String> {
    val parsed = mutableMapOf<String, String>()

    for (index in 0 until size()) {
      val header = getMap(index) ?: throw IllegalArgumentException("Missing multipart header at index $index")
      val name =
        header.getString("name") ?: throw IllegalArgumentException("Multipart header $index is missing name")
      if (header.getType("value") == ReadableType.Null) {
        continue
      }
      val value =
        header.getString("value")
          ?: header.getDynamic("value").asString()
          ?: throw IllegalArgumentException("Multipart header $index is missing value")
      parsed[name] = value
    }

    return parsed
  }

  private fun ReadableMap.toProgressOptions(): StreamMultipartUploadProgressOptions {
    val count =
      if (hasKey("count") && !isNull("count")) {
        getDouble("count").toInt()
      } else {
        null
      }
    val intervalMs =
      if (hasKey("intervalMs") && !isNull("intervalMs")) {
        getDouble("intervalMs").toLong()
      } else {
        null
      }

    return StreamMultipartUploadProgressOptions(
      count = count,
      intervalMs = intervalMs,
    )
  }
}
