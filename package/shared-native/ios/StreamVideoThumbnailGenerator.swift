import AVFoundation
import Photos
import UIKit

private final class StreamPhotoLibraryAssetRequestState: @unchecked Sendable {
  let lock = NSLock()
  var didResume = false
  var requestID: PHImageRequestID = PHInvalidImageRequestID
}

@objcMembers
public final class StreamVideoThumbnailResult: NSObject {
  public let error: String?
  public let uri: String?

  public init(error: String? = nil, uri: String? = nil) {
    self.error = error
    self.uri = uri
  }
}

@objcMembers
public final class StreamVideoThumbnailGenerator: NSObject {
  private static let compressionQuality: CGFloat = 0.8
  private static let maxDimension: CGFloat = 512
  private static let cacheVersion = "v1"
  private static let cacheDirectoryName = "@stream-io-stream-video-thumbnails"
  private static let maxConcurrentGenerations = 5
  private static let photoLibraryAssetResolutionTimeout: TimeInterval = 3

  @objc(generateThumbnailsWithUrls:completion:)
  public static func generateThumbnails(
    urls: [String],
    completion: @escaping ([StreamVideoThumbnailResult]) -> Void
  ) {
    Task(priority: .userInitiated) {
      completion(await generateThumbnailsAsync(urls: urls))
    }
  }

  private static func generateThumbnailsAsync(urls: [String]) async -> [StreamVideoThumbnailResult] {
    guard !urls.isEmpty else {
      return []
    }

    if urls.count == 1 {
      return [await generateThumbnailResult(url: urls[0])]
    }

    let parallelism = min(maxConcurrentGenerations, urls.count)

    return await withTaskGroup(
      of: (Int, StreamVideoThumbnailResult).self,
      returning: [StreamVideoThumbnailResult].self
    ) { group in
      var thumbnails = Array<StreamVideoThumbnailResult?>(repeating: nil, count: urls.count)
      var nextIndexToSchedule = 0

      while nextIndexToSchedule < parallelism {
        let index = nextIndexToSchedule
        let url = urls[index]
        group.addTask {
          (index, await generateThumbnailResult(url: url))
        }
        nextIndexToSchedule += 1
      }

      while let (index, thumbnail) = await group.next() {
        thumbnails[index] = thumbnail

        if nextIndexToSchedule < urls.count {
          let nextIndex = nextIndexToSchedule
          let nextURL = urls[nextIndex]
          group.addTask {
            (nextIndex, await generateThumbnailResult(url: nextURL))
          }
          nextIndexToSchedule += 1
        }
      }

      return thumbnails.enumerated().map { index, thumbnail in
        thumbnail ?? StreamVideoThumbnailResult(
          error: "Thumbnail generation produced no output for index \(index)",
          uri: nil
        )
      }
    }
  }

  private static func generateThumbnailResult(url: String) async -> StreamVideoThumbnailResult {
    do {
      return StreamVideoThumbnailResult(uri: try await generateThumbnail(url: url))
    } catch {
      return StreamVideoThumbnailResult(
        error: error.localizedDescription,
        uri: nil
      )
    }
  }

  private static func generateThumbnail(url: String) async throws -> String {
    let outputDirectory = try thumbnailCacheDirectory()
    let outputURL = outputDirectory
      .appendingPathComponent(buildCacheFileName(url: url))
      .appendingPathExtension("jpg")

    if
      FileManager.default.fileExists(atPath: outputURL.path),
      let attributes = try? FileManager.default.attributesOfItem(atPath: outputURL.path),
      let fileSize = attributes[.size] as? NSNumber,
      fileSize.intValue > 0
    {
      return outputURL.absoluteString
    }

    let image = try await resolveThumbnailImage(url: url)

    guard let data = image.jpegData(compressionQuality: compressionQuality) else {
      throw thumbnailError(code: 2, message: "Failed to encode JPEG thumbnail for \(url)")
    }

    do {
      try data.write(to: outputURL, options: .atomic)
      return outputURL.absoluteString
    } catch {
      throw thumbnailError(error, code: 3, message: "Thumbnail generation failed for \(url)")
    }
  }

  private static func resolveThumbnailImage(url: String) async throws -> UIImage {
    if isPhotoLibraryURL(url) {
      return try await resolvePhotoLibraryThumbnail(url: url)
    }

    if let normalizedURL = normalizeLocalURL(url) {
      return try generateLocalVideoThumbnail(url: normalizedURL)
    }

    throw thumbnailError(code: 5, message: "Unsupported video URL for thumbnail generation: \(url)")
  }

  private static func generateLocalVideoThumbnail(url: URL) throws -> UIImage {
    let asset = AVURLAsset(url: url)
    let generator = AVAssetImageGenerator(asset: asset)
    generator.appliesPreferredTrackTransform = true
    generator.maximumSize = CGSize(width: maxDimension, height: maxDimension)

    do {
      let cgImage = try generator.copyCGImage(at: thumbnailTime(for: asset), actualTime: nil)
      return UIImage(cgImage: cgImage)
    } catch {
      throw thumbnailError(error, code: 3, message: "Thumbnail generation failed for \(url.absoluteString)")
    }
  }

  private static func thumbnailCacheDirectory() throws -> URL {
    let outputDirectory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent(cacheDirectoryName, isDirectory: true)
    try FileManager.default.createDirectory(
      at: outputDirectory,
      withIntermediateDirectories: true
    )
    return outputDirectory
  }

  private static func buildCacheFileName(url: String) -> String {
    let cacheKey = fnv1a64("\(cacheVersion)|\(Int(maxDimension))|\(compressionQuality)|\(url)")
    return "stream-video-thumbnail-\(cacheKey)"
  }

  private static func fnv1a64(_ value: String) -> String {
    var hash: UInt64 = 0xcbf29ce484222325
    let prime: UInt64 = 0x100000001b3

    for byte in value.utf8 {
      hash ^= UInt64(byte)
      hash &*= prime
    }

    return String(hash, radix: 16)
  }

  private static func thumbnailTime(for asset: AVAsset) -> CMTime {
    let durationSeconds = asset.duration.seconds
    if durationSeconds.isFinite, durationSeconds > 0.1 {
      return CMTime(seconds: 0.1, preferredTimescale: 600)
    }

    return .zero
  }

  private static func isPhotoLibraryURL(_ url: String) -> Bool {
    url.lowercased().hasPrefix("ph://")
  }

  private static func resolvePhotoLibraryThumbnail(url: String) async throws -> UIImage {
    let identifier = photoLibraryIdentifier(from: url)

    guard !identifier.isEmpty else {
      throw thumbnailError(code: 6, message: "Missing photo library identifier for \(url)")
    }

    let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: nil)
    guard let asset = fetchResult.firstObject else {
      throw thumbnailError(code: 7, message: "Failed to find photo library asset for \(url)")
    }

    // Request a thumbnail sized image instead of the full AVAsset: PhotoKit
    // serves a locally cached thumbnail even for iCloud only assets, so this
    // avoids downloading the entire video the way requestAVAsset(forVideo:) would.
    let options = PHImageRequestOptions()
    options.deliveryMode = .fastFormat
    options.resizeMode = .fast
    options.isNetworkAccessAllowed = true
    options.isSynchronous = false

    let targetSize = CGSize(width: maxDimension, height: maxDimension)

    return try await withThrowingTaskGroup(of: UIImage.self) { group in
      group.addTask {
        try await requestPhotoLibraryImage(
          url: url,
          asset: asset,
          targetSize: targetSize,
          options: options
        )
      }
      group.addTask {
        try await Task.sleep(nanoseconds: UInt64(photoLibraryAssetResolutionTimeout * 1_000_000_000))
        throw thumbnailError(
          code: 11,
          message: "Timed out resolving photo library thumbnail for \(url)"
        )
      }

      guard let image = try await group.next() else {
        throw thumbnailError(
          code: 10,
          message: "Failed to resolve photo library thumbnail for \(url)"
        )
      }

      group.cancelAll()
      return image
    }
  }

  private static func requestPhotoLibraryImage(
    url: String,
    asset: PHAsset,
    targetSize: CGSize,
    options: PHImageRequestOptions
  ) async throws -> UIImage {
    let imageManager = PHImageManager.default()
    let state = StreamPhotoLibraryAssetRequestState()

    return try await withTaskCancellationHandler(operation: {
      try await withCheckedThrowingContinuation { continuation in
        let requestID = imageManager.requestImage(
          for: asset,
          targetSize: targetSize,
          contentMode: .aspectFit,
          options: options
        ) { image, info in
          // Accept the first delivered image (.fastFormat sends exactly one,
          // thumbnail quality, possibly flagged degraded and that's what we want).
          state.lock.lock()
          if state.didResume {
            state.lock.unlock()
            return
          }
          state.didResume = true
          state.lock.unlock()

          if let isCancelled = (info?[PHImageCancelledKey] as? NSNumber)?.boolValue, isCancelled {
            continuation.resume(
              throwing: thumbnailError(
                code: 8,
                message: "Photo library image request was cancelled for \(url)"
              )
            )
            return
          }

          if let error = info?[PHImageErrorKey] as? Error {
            continuation.resume(
              throwing: thumbnailError(
                error,
                code: 9,
                message: "Photo library image request failed for \(url)"
              )
            )
            return
          }

          guard let image else {
            continuation.resume(
              throwing: thumbnailError(
                code: 10,
                message: "Failed to resolve photo library thumbnail for \(url)"
              )
            )
            return
          }

          continuation.resume(returning: image)
        }

        state.lock.lock()
        state.requestID = requestID
        state.lock.unlock()
      }
    }, onCancel: {
      state.lock.lock()
      let requestID = state.requestID
      state.lock.unlock()

      if requestID != PHInvalidImageRequestID {
        imageManager.cancelImageRequest(requestID)
      }
    })
  }

  private static func photoLibraryIdentifier(from url: String) -> String {
    guard let parsedURL = URL(string: url), parsedURL.scheme?.lowercased() == "ph" else {
      return url
        .replacingOccurrences(of: "ph://", with: "", options: [.caseInsensitive])
        .removingPercentEncoding?
        .trimmingCharacters(in: CharacterSet(charactersIn: "/")) ?? ""
    }

    let host = parsedURL.host ?? ""
    let path = parsedURL.path
    let combined = host.isEmpty ? path : "\(host)\(path)"
    return combined.removingPercentEncoding?
      .trimmingCharacters(in: CharacterSet(charactersIn: "/")) ?? ""
  }

  private static func normalizeLocalURL(_ url: String) -> URL? {
    if let parsedURL = URL(string: url), let scheme = parsedURL.scheme?.lowercased() {
      if scheme == "file" {
        return sanitizedFileURL(parsedURL)
      }

      return nil
    }

    return sanitizedFileURL(URL(fileURLWithPath: url))
  }

  private static func sanitizedFileURL(_ url: URL) -> URL {
    guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
      return url
    }

    components.fragment = nil
    components.query = nil

    return components.url ?? url
  }

  private static func thumbnailError(
    _ error: Error? = nil,
    code: Int,
    message: String
  ) -> Error {
    let description = error.map { "\(message): \($0.localizedDescription)" } ?? message
    return NSError(
      domain: "StreamVideoThumbnail",
      code: code,
      userInfo: [NSLocalizedDescriptionKey: description]
    )
  }
}
