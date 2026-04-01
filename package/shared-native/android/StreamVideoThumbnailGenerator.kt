package com.streamchatreactnative.shared

import android.content.Context
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Executors

data class StreamVideoThumbnailResult(
  val error: String? = null,
  val uri: String? = null,
)

object StreamVideoThumbnailGenerator {
  private const val DEFAULT_COMPRESSION_QUALITY = 70
  private const val DEFAULT_MAX_DIMENSION = 256
  private const val CACHE_VERSION = "v1"
  private const val CACHE_DIRECTORY_NAME = "@stream-io-stream-video-thumbnails"
  private const val MAX_CONCURRENT_GENERATIONS = 5

  fun generateThumbnails(context: Context, urls: List<String>): List<StreamVideoThumbnailResult> {
    if (urls.size <= 1) {
      return urls.map { url -> generateThumbnailResult(context, url) }
    }

    val parallelism = minOf(urls.size, MAX_CONCURRENT_GENERATIONS)
    val executor = Executors.newFixedThreadPool(parallelism)

    return try {
      val tasks = urls.map { url ->
        executor.submit<StreamVideoThumbnailResult> {
          generateThumbnailResult(context, url)
        }
      }
      tasks.map { task -> task.get() }
    } finally {
      executor.shutdown()
    }
  }

  private fun generateThumbnailResult(context: Context, url: String): StreamVideoThumbnailResult {
    return try {
      StreamVideoThumbnailResult(uri = generateThumbnail(context, url))
    } catch (error: Throwable) {
      StreamVideoThumbnailResult(
        error = error.message ?: "Thumbnail generation failed for $url",
        uri = null,
      )
    }
  }

  private fun generateThumbnail(context: Context, url: String): String {
    val outputDirectory = File(context.cacheDir, CACHE_DIRECTORY_NAME).apply { mkdirs() }
    val outputFile = File(outputDirectory, buildCacheFileName(url))

    if (outputFile.isFile() && outputFile.length() > 0L) {
      return Uri.fromFile(outputFile).toString()
    }

    val retriever = MediaMetadataRetriever()

    return try {
      setDataSource(retriever, context, url)
      val frame =
        retriever.getFrameAtTime(100000, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
          ?: throw IllegalStateException("Failed to extract video frame for $url")
      val scaledFrame = scaleBitmap(frame)

      FileOutputStream(outputFile).use { stream ->
        scaledFrame.compress(Bitmap.CompressFormat.JPEG, DEFAULT_COMPRESSION_QUALITY, stream)
      }

      if (scaledFrame != frame) {
        scaledFrame.recycle()
      }
      frame.recycle()

      Uri.fromFile(outputFile).toString()
    } catch (error: Throwable) {
      throw IllegalStateException("Thumbnail generation failed for $url", error)
    } finally {
      try {
        retriever.release()
      } catch (_: Throwable) {
        // Ignore cleanup failures.
      }
    }
  }

  private fun buildCacheFileName(url: String): String {
    val cacheKey =
      fnv1a64("$CACHE_VERSION|$DEFAULT_MAX_DIMENSION|$DEFAULT_COMPRESSION_QUALITY|$url")
    return "stream-video-thumbnail-$cacheKey.jpg"
  }

  private fun fnv1a64(value: String): String {
    var hash = -0x340d631b8c46751fL

    value.toByteArray(Charsets.UTF_8).forEach { byte ->
      hash = hash xor (byte.toLong() and 0xff)
      hash *= 0x100000001b3L
    }

    return java.lang.Long.toUnsignedString(hash, 16)
  }

  private fun setDataSource(retriever: MediaMetadataRetriever, context: Context, url: String) {
    val uri = Uri.parse(url)
    val scheme = uri.scheme?.lowercase()

    when {
      scheme.isNullOrEmpty() -> retriever.setDataSource(url)
      scheme == "content" || scheme == "file" -> retriever.setDataSource(context, uri)
      else ->
        throw IllegalArgumentException(
          "Unsupported video URI scheme for thumbnail generation: $scheme. Local assets only.",
        )
    }
  }

  private fun scaleBitmap(bitmap: Bitmap): Bitmap {
    val width = bitmap.width
    val height = bitmap.height
    val largestDimension = maxOf(width, height)

    if (largestDimension <= DEFAULT_MAX_DIMENSION) {
      return bitmap
    }

    val scale = DEFAULT_MAX_DIMENSION.toFloat() / largestDimension.toFloat()
    val targetWidth = (width * scale).toInt().coerceAtLeast(1)
    val targetHeight = (height * scale).toInt().coerceAtLeast(1)

    return Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
  }
}
