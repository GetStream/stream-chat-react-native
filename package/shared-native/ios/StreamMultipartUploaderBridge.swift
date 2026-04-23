import Foundation

private final class StreamMultipartUploadBridgeTaskBox {
  private let lock = NSLock()
  private var isCancelled = false
  private var task: Task<Void, Never>?

  func setTask(_ task: Task<Void, Never>) {
    lock.lock()
    if isCancelled {
      lock.unlock()
      task.cancel()
      return
    }

    self.task = task
    lock.unlock()
  }

  func cancel() {
    lock.lock()
    isCancelled = true
    let task = self.task
    lock.unlock()

    task?.cancel()
  }
}

@objcMembers
public final class StreamMultipartUploaderBridge: NSObject {
  private static let taskLock = NSLock()
  private static var tasksByUploadId = [String: StreamMultipartUploadBridgeTaskBox]()

  @objc(uploadMultipartWithUploadId:url:method:headers:parts:progress:timeoutMs:onProgress:completion:)
  public static func uploadMultipart(
    uploadId: String,
    url: String,
    method: String,
    headers: [[String: String]],
    parts: [[String: Any]],
    progress: [String: Any]?,
    timeoutMs: NSNumber?,
    onProgress: @escaping (NSNumber, NSNumber?) -> Void,
    completion: @escaping (NSDictionary?, NSError?) -> Void
  ) {
    let taskBox = StreamMultipartUploadBridgeTaskBox()
    var replacedTaskBox: StreamMultipartUploadBridgeTaskBox?

    taskLock.lock()
    replacedTaskBox = tasksByUploadId[uploadId]
    tasksByUploadId[uploadId] = taskBox
    taskLock.unlock()
    if replacedTaskBox != nil {
      replacedTaskBox?.cancel()
      StreamMultipartUploadManager.shared.cancelInFlight(uploadId: uploadId)
    }

    let task = Task(priority: .userInitiated) {
      defer {
        taskLock.lock()
        if tasksByUploadId[uploadId] === taskBox {
          tasksByUploadId.removeValue(forKey: uploadId)
        }
        taskLock.unlock()
      }

      do {
        let response = try await StreamMultipartUploadManager.shared.uploadMultipart(
          uploadId: uploadId,
          url: url,
          method: method,
          headers: dictionary(from: headers),
          parts: parts,
          progress: progress,
          timeoutMs: timeoutMs?.doubleValue,
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

    taskBox.setTask(task)
  }

  @objc(cancelUploadWithUploadId:)
  public static func cancelUpload(uploadId: String) {
    taskLock.lock()
    let taskBox = tasksByUploadId.removeValue(forKey: uploadId)
    taskLock.unlock()

    taskBox?.cancel()
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
    if self is CancellationError {
      return NSError(
        domain: "StreamMultipartUploader",
        code: 2,
        userInfo: [NSLocalizedDescriptionKey: StreamMultipartUploadError.cancelled.localizedDescription]
      )
    }

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
