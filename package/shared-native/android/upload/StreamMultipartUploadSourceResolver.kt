package com.streamchatreactnative.shared.upload

import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.OpenableColumns
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.net.URLConnection

object StreamMultipartUploadSourceResolver {
  fun contentLength(context: Context, uriString: String): Long? {
    val uri = normalizeUri(uriString)

    return when (uri.scheme?.lowercase()) {
      null, "file" -> {
        val file = toFile(uri, uriString)
        if (!file.exists()) {
          throw IllegalArgumentException("File does not exist for upload: $uriString")
        }
        file.length()
      }

      "content" -> {
        context.contentResolver.openAssetFileDescriptor(uri, "r")?.use { descriptor ->
          descriptor.length.takeIf { it >= 0L }
        } ?: queryLongColumn(context, uri, OpenableColumns.SIZE)
      }

      else -> throw IllegalArgumentException("Unsupported upload URI scheme: ${uri.scheme}")
    }
  }

  fun mimeType(context: Context, part: StreamMultipartFilePart): String {
    val explicitMimeType = part.mimeType?.takeIf { it.isNotBlank() }
    if (explicitMimeType != null) {
      return explicitMimeType
    }

    val uri = normalizeUri(part.uri)
    val contentResolverMime = context.contentResolver.getType(uri)
    if (!contentResolverMime.isNullOrBlank()) {
      return contentResolverMime
    }

    return URLConnection.guessContentTypeFromName(part.fileName) ?: "application/octet-stream"
  }

  fun openInputStream(context: Context, uriString: String): InputStream {
    val uri = normalizeUri(uriString)

    return when (uri.scheme?.lowercase()) {
      null, "file" -> FileInputStream(toFile(uri, uriString))
      "content" ->
        context.contentResolver.openInputStream(uri)
          ?: throw IllegalArgumentException("Failed to open content URI for upload: $uriString")
      else -> throw IllegalArgumentException("Unsupported upload URI scheme: ${uri.scheme}")
    }
  }

  private fun normalizeUri(uriString: String): Uri {
    if (uriString.startsWith("/")) {
      return Uri.fromFile(File(uriString))
    }

    val parsed = Uri.parse(uriString)

    if (parsed.scheme.isNullOrBlank()) {
      return Uri.fromFile(File(uriString))
    }

    return parsed
  }

  private fun queryLongColumn(context: Context, uri: Uri, columnName: String): Long? {
    val projection = arrayOf(columnName)
    val cursor: Cursor =
      context.contentResolver.query(uri, projection, null, null, null) ?: return null

    cursor.use {
      if (!it.moveToFirst()) {
        return null
      }

      val columnIndex = it.getColumnIndex(columnName)
      if (columnIndex == -1 || it.isNull(columnIndex)) {
        return null
      }

      return it.getLong(columnIndex)
    }
  }

  private fun toFile(uri: Uri, original: String): File {
    val path = uri.path ?: original
    return File(path)
  }
}
