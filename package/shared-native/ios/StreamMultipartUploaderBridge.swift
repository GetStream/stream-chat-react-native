import Foundation

@objcMembers
public final class StreamMultipartUploaderBridge: NSObject {
  @objc(uploadMultipartWithUploadId:url:method:headers:parts:progress:onProgress:completion:)
  public static func uploadMultipart(
    uploadId: String,
    url: String,
    method: String,
    headers: [[String: String]],
    parts: [[String: Any]],
    progress: [String: Any]?,
    onProgress: @escaping (NSNumber, NSNumber?) -> Void,
    completion: @escaping (NSDictionary?, NSError?) -> Void
  ) {
    Task(priority: .userInitiated) {
      do {
        let response = try await StreamMultipartUploadManager.shared.uploadMultipart(
          uploadId: uploadId,
          url: url,
          method: method,
          headers: dictionary(from: headers),
          parts: parts,
          progress: progress,
          onProgress: { loaded, total in
            onProgress(NSNumber(value: loaded), total.map { NSNumber(value: $0) })
          }
        )

        let payload = NSMutableDictionary(capacity: 4)
        payload["body"] = response.body
        payload["headers"] = headerEntries(from: response.headers)
        payload["status"] = NSNumber(value: response.status)
        payload["statusText"] = response.statusText ?? NSNull()

        completion(payload, nil)
      } catch {
        completion(nil, error.asStreamMultipartNSError())
      }
    }
  }

  @objc(cancelUploadWithUploadId:)
  public static func cancelUpload(uploadId: String) {
    StreamMultipartUploadManager.shared.cancel(uploadId: uploadId)
  }

  private static func dictionary(from headers: [[String: String]]) -> [String: String] {
    headers.reduce(into: [String: String]()) { result, header in
      guard let name = header["name"], let value = header["value"] else {
        return
      }
      result[name] = value
    }
  }

  private static func headerEntries(from headers: [String: String]) -> [[String: String]] {
    headers.map { name, value in
      ["name": name, "value": value]
    }
  }
}

private extension Error {
  func asStreamMultipartNSError() -> NSError {
    let nsError = self as NSError

    if nsError.domain != NSCocoaErrorDomain || nsError.code != 0 {
      return nsError
    }

    return NSError(
      domain: "StreamMultipartUploader",
      code: 1,
      userInfo: [NSLocalizedDescriptionKey: localizedDescription]
    )
  }
}
