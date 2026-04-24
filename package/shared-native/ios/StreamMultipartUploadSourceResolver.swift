import AVFoundation
import Foundation
import MobileCoreServices
import Photos
import UniformTypeIdentifiers

private final class StreamPhotoRequestBox {
  private let lock = NSLock()
  private var isCancelled = false
  private var requestId: PHImageRequestID = PHInvalidImageRequestID

  func set(_ requestId: PHImageRequestID) {
    let shouldCancel: Bool

    lock.lock()
    if isCancelled {
      shouldCancel = true
    } else {
      self.requestId = requestId
      shouldCancel = false
    }
    lock.unlock()

    if shouldCancel, requestId != PHInvalidImageRequestID {
      PHImageManager.default().cancelImageRequest(requestId)
    }
  }

  func cancel() {
    lock.lock()
    isCancelled = true
    let requestId = self.requestId
    lock.unlock()

    if requestId != PHInvalidImageRequestID {
      PHImageManager.default().cancelImageRequest(requestId)
    }
  }
}

private final class StreamContentEditingInputRequestBox {
  private let lock = NSLock()
  private weak var asset: PHAsset?
  private var isCancelled = false
  private var requestId: PHContentEditingInputRequestID = 0

  init(asset: PHAsset) {
    self.asset = asset
  }

  func set(_ requestId: PHContentEditingInputRequestID) {
    let asset: PHAsset?
    let shouldCancel: Bool

    lock.lock()
    asset = self.asset
    if isCancelled {
      shouldCancel = true
    } else {
      self.requestId = requestId
      shouldCancel = false
    }
    lock.unlock()

    if shouldCancel, requestId != 0 {
      asset?.cancelContentEditingInputRequest(requestId)
    }
  }

  func cancel() {
    lock.lock()
    isCancelled = true
    let requestId = self.requestId
    let asset = self.asset
    lock.unlock()

    if requestId != 0 {
      asset?.cancelContentEditingInputRequest(requestId)
    }
  }
}

private final class StreamMultipartContinuationBox<Value> {
  private let lock = NSLock()
  private var continuation: CheckedContinuation<Value, Error>?
  private var pendingResult: Result<Value, Error>?
  private var hasResumed = false

  func set(_ continuation: CheckedContinuation<Value, Error>) {
    let result: Result<Value, Error>?

    lock.lock()
    if let pendingResult {
      self.pendingResult = nil
      result = pendingResult
    } else if hasResumed {
      result = nil
    } else {
      self.continuation = continuation
      result = nil
    }
    lock.unlock()

    if let result {
      resume(continuation, with: result)
    }
  }

  func resume(returning value: Value) {
    resume(with: .success(value))
  }

  func resume(throwing error: Error) {
    resume(with: .failure(error))
  }

  private func resume(with result: Result<Value, Error>) {
    let continuationToResume: CheckedContinuation<Value, Error>?

    lock.lock()
    if hasResumed {
      continuationToResume = nil
    } else if let continuation {
      self.continuation = nil
      hasResumed = true
      continuationToResume = continuation
    } else {
      pendingResult = result
      hasResumed = true
      continuationToResume = nil
    }
    lock.unlock()

    if let continuationToResume {
      resume(continuationToResume, with: result)
    }
  }

  private func resume(
    _ continuation: CheckedContinuation<Value, Error>,
    with result: Result<Value, Error>
  ) {
    switch result {
    case .success(let value):
      continuation.resume(returning: value)
    case .failure(let error):
      continuation.resume(throwing: error)
    }
  }
}

struct StreamMultipartResolvedFilePart {
  let fieldName: String
  let fileName: String
  let fileURL: URL
  let mimeType: String
  let size: Int64?
}

enum StreamMultipartUploadSourceResolver {
  static func resolve(_ part: StreamMultipartFilePart) async throws -> StreamMultipartResolvedFilePart {
    try Task.checkCancellation()
    let fileURL = sanitizeFileURL(try await resolveFileURL(from: part.uri))
    try Task.checkCancellation()
    let mimeType = part.mimeType ?? guessMimeType(fileURL: fileURL, fallbackFileName: part.fileName)
    let size = fileSize(url: fileURL)

    return StreamMultipartResolvedFilePart(
      fieldName: part.fieldName,
      fileName: part.fileName,
      fileURL: fileURL,
      mimeType: mimeType,
      size: size
    )
  }

  private static func resolveFileURL(from uri: String) async throws -> URL {
    if uri.lowercased().hasPrefix("ph://") {
      return try await resolvePhotoLibraryURL(from: uri)
    }

    if uri.lowercased().hasPrefix("assets-library://") {
      return try await resolveAssetsLibraryURL(from: uri)
    }

    if uri.hasPrefix("/") {
      return URL(fileURLWithPath: uri)
    }

    guard let parsedURL = URL(string: uri) else {
      throw StreamMultipartUploadError.unsupportedSource(uri)
    }

    if parsedURL.isFileURL {
      return parsedURL
    }

    throw StreamMultipartUploadError.unsupportedSource(uri)
  }

  private static func sanitizeFileURL(_ url: URL) -> URL {
    guard url.isFileURL else {
      return url
    }

    guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
      return url
    }

    components.fragment = nil
    components.query = nil

    return components.url ?? url
  }

  private static func resolvePhotoLibraryURL(from uri: String) async throws -> URL {
    let identifier = photoLibraryIdentifier(from: uri)
    guard !identifier.isEmpty else {
      throw StreamMultipartUploadError.unsupportedSource(uri)
    }

    let result = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: nil)
    guard let asset = result.firstObject else {
      throw StreamMultipartUploadError.unsupportedSource(uri)
    }

    return try await resolveAssetURL(asset)
  }

  @available(iOS, deprecated: 11.0)
  private static func resolveAssetsLibraryURL(from uri: String) async throws -> URL {
    guard let assetURL = URL(string: uri) else {
      throw StreamMultipartUploadError.unsupportedSource(uri)
    }

    let result = PHAsset.fetchAssets(withALAssetURLs: [assetURL], options: nil)
    guard let asset = result.firstObject else {
      throw StreamMultipartUploadError.unsupportedSource(uri)
    }

    return try await resolveAssetURL(asset)
  }

  private static func resolveAssetURL(_ asset: PHAsset) async throws -> URL {
    switch asset.mediaType {
    case .video:
      return try await requestVideoAssetURL(asset)
    case .image:
      return try await requestImageAssetURL(asset)
    default:
      throw StreamMultipartUploadError.unsupportedSource(asset.localIdentifier)
    }
  }

  private static func requestImageAssetURL(_ asset: PHAsset) async throws -> URL {
    let options = PHContentEditingInputRequestOptions()
    options.isNetworkAccessAllowed = true
    let requestBox = StreamContentEditingInputRequestBox(asset: asset)
    let continuationBox = StreamMultipartContinuationBox<URL>()

    return try await withTaskCancellationHandler {
      try await withCheckedThrowingContinuation { continuation in
        continuationBox.set(continuation)
        if Task.isCancelled {
          continuationBox.resume(throwing: StreamMultipartUploadError.cancelled)
          return
        }

        let requestId = asset.requestContentEditingInput(with: options) { input, _ in
          if Task.isCancelled {
            continuationBox.resume(throwing: StreamMultipartUploadError.cancelled)
            return
          }

          if let url = input?.fullSizeImageURL {
            continuationBox.resume(returning: url)
            return
          }

          continuationBox.resume(
            throwing: StreamMultipartUploadError.unsupportedSource(asset.localIdentifier)
          )
        }
        requestBox.set(requestId)
      }
    } onCancel: {
      requestBox.cancel()
      continuationBox.resume(throwing: StreamMultipartUploadError.cancelled)
    }
  }

  private static func requestVideoAssetURL(_ asset: PHAsset) async throws -> URL {
    let options = PHVideoRequestOptions()
    options.deliveryMode = .highQualityFormat
    options.isNetworkAccessAllowed = true
    options.version = .current
    let requestBox = StreamPhotoRequestBox()
    let continuationBox = StreamMultipartContinuationBox<URL>()

    return try await withTaskCancellationHandler {
      try await withCheckedThrowingContinuation { continuation in
        continuationBox.set(continuation)
        if Task.isCancelled {
          continuationBox.resume(throwing: StreamMultipartUploadError.cancelled)
          return
        }

        let requestId = PHImageManager.default().requestAVAsset(forVideo: asset, options: options) { avAsset, _, info in
          if Task.isCancelled {
            continuationBox.resume(throwing: StreamMultipartUploadError.cancelled)
            return
          }

          if let isCancelled = (info?[PHImageCancelledKey] as? NSNumber)?.boolValue, isCancelled {
            continuationBox.resume(throwing: StreamMultipartUploadError.cancelled)
            return
          }

          if let error = info?[PHImageErrorKey] as? Error {
            continuationBox.resume(throwing: error)
            return
          }

          if let url = (avAsset as? AVURLAsset)?.url {
            continuationBox.resume(returning: url)
            return
          }

          continuationBox.resume(
            throwing: StreamMultipartUploadError.unsupportedSource(asset.localIdentifier)
          )
        }
        requestBox.set(requestId)
      }
    } onCancel: {
      requestBox.cancel()
      continuationBox.resume(throwing: StreamMultipartUploadError.cancelled)
    }
  }

  private static func guessMimeType(fileURL: URL, fallbackFileName: String) -> String {
    if #available(iOS 14.0, *), let type = UTType(filenameExtension: fileURL.pathExtension) {
      return type.preferredMIMEType ?? "application/octet-stream"
    }

    let fileName = fileURL.lastPathComponent.isEmpty ? fallbackFileName : fileURL.lastPathComponent
    return mimeTypeFromExtension(fileName) ?? "application/octet-stream"
  }

  private static func mimeTypeFromExtension(_ fileName: String) -> String? {
    let pathExtension = (fileName as NSString).pathExtension
    guard !pathExtension.isEmpty else {
      return nil
    }

    if let unmanaged = UTTypeCreatePreferredIdentifierForTag(
      kUTTagClassFilenameExtension,
      pathExtension as CFString,
      nil
    )?.takeRetainedValue(),
      let mime = UTTypeCopyPreferredTagWithClass(unmanaged, kUTTagClassMIMEType)?.takeRetainedValue()
    {
      return mime as String
    }

    return nil
  }

  private static func fileSize(url: URL) -> Int64? {
    let values = try? url.resourceValues(forKeys: [.fileSizeKey])
    guard let fileSize = values?.fileSize else {
      return nil
    }
    return Int64(fileSize)
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
}
