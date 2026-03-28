import AVFoundation
import Photos
import UIKit

@objcMembers
public final class StreamVideoThumbnailGenerator: NSObject {
  private static let compressionQuality: CGFloat = 0.8
  private static let maxDimension: CGFloat = 512

  @objc(generateThumbnailsWithUrls:error:)
  public static func generateThumbnails(urls: [String]) throws -> [String] {
    try urls.map { url in
      try generateThumbnail(url: url)
    }
  }

  private static func generateThumbnail(url: String) throws -> String {
    guard let asset = resolveAsset(url: url) else {
      throw NSError(
        domain: "StreamVideoThumbnail",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: "Failed to resolve video asset for \(url)"]
      )
    }

    let generator = AVAssetImageGenerator(asset: asset)
    generator.appliesPreferredTrackTransform = true
    generator.maximumSize = CGSize(width: maxDimension, height: maxDimension)

    let requestedTime = thumbnailTime(for: asset)

    do {
      let cgImage = try generator.copyCGImage(at: requestedTime, actualTime: nil)
      let image = UIImage(cgImage: cgImage)
      guard let data = image.jpegData(compressionQuality: compressionQuality) else {
        throw NSError(
          domain: "StreamVideoThumbnail",
          code: 2,
          userInfo: [NSLocalizedDescriptionKey: "Failed to encode JPEG thumbnail for \(url)"]
        )
      }

      let outputDirectory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("stream-video-thumbnails", isDirectory: true)
      try FileManager.default.createDirectory(
        at: outputDirectory,
        withIntermediateDirectories: true
      )

      let outputURL = outputDirectory
        .appendingPathComponent("stream-video-thumbnail-\(UUID().uuidString)")
        .appendingPathExtension("jpg")
      try data.write(to: outputURL, options: .atomic)
      return outputURL.absoluteString
    } catch {
      throw NSError(
        domain: "StreamVideoThumbnail",
        code: 3,
        userInfo: [
          NSLocalizedDescriptionKey: "Thumbnail generation failed for \(url): \(error.localizedDescription)",
        ]
      )
    }
  }

  private static func thumbnailTime(for asset: AVAsset) -> CMTime {
    let durationSeconds = asset.duration.seconds
    if durationSeconds.isFinite, durationSeconds > 0.1 {
      return CMTime(seconds: 0.1, preferredTimescale: 600)
    }

    return .zero
  }

  private static func resolveAsset(url: String) -> AVAsset? {
    if isPhotoLibraryURL(url) {
      return resolvePhotoLibraryAsset(url: url)
    }

    if let normalizedURL = normalizeURL(url) {
      return AVURLAsset(url: normalizedURL)
    }

    return nil
  }

  private static func isPhotoLibraryURL(_ url: String) -> Bool {
    url.lowercased().hasPrefix("ph://")
  }

  private static func resolvePhotoLibraryAsset(url: String) -> AVAsset? {
    let identifier = photoLibraryIdentifier(from: url)

    guard !identifier.isEmpty else {
      return nil
    }

    let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: nil)
    guard let asset = fetchResult.firstObject else {
      return nil
    }

    let options = PHVideoRequestOptions()
    options.deliveryMode = .highQualityFormat
    options.isNetworkAccessAllowed = true
    options.version = .current

    let semaphore = DispatchSemaphore(value: 0)
    var resolvedAsset: AVAsset?

    PHImageManager.default().requestAVAsset(forVideo: asset, options: options) { avAsset, _, _ in
      resolvedAsset = avAsset
      semaphore.signal()
    }

    semaphore.wait()
    return resolvedAsset
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

  private static func normalizeURL(_ url: String) -> URL? {
    if let parsedURL = URL(string: url), parsedURL.scheme != nil {
      return parsedURL
    }

    return URL(fileURLWithPath: url)
  }
}
