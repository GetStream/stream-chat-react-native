import Foundation

private actor StreamMultipartUploadConcurrencyLimiter {
  private var activeUploads = 0
  private let maxConcurrentUploads: Int
  private var waiterOrder = [UUID]()
  private var waiters = [UUID: CheckedContinuation<Void, Error>]()

  init(maxConcurrentUploads: Int) {
    self.maxConcurrentUploads = max(1, maxConcurrentUploads)
  }

  func acquire() async throws {
    if activeUploads < maxConcurrentUploads {
      activeUploads += 1
      return
    }

    let waiterId = UUID()

    try await withTaskCancellationHandler {
      try await withCheckedThrowingContinuation { continuation in
        if activeUploads < maxConcurrentUploads {
          activeUploads += 1
          continuation.resume()
          return
        }

        waiterOrder.append(waiterId)
        waiters[waiterId] = continuation
      }
    } onCancel: {
      Task {
        await self.cancelWaiter(id: waiterId)
      }
    }
  }

  func release() {
    while !waiterOrder.isEmpty {
      let waiterId = waiterOrder.removeFirst()

      guard let continuation = waiters.removeValue(forKey: waiterId) else {
        continue
      }

      continuation.resume()
      return
    }

    activeUploads = max(0, activeUploads - 1)
  }

  private func cancelWaiter(id: UUID) {
    waiterOrder.removeAll { $0 == id }
    waiters.removeValue(forKey: id)?.resume(throwing: StreamMultipartUploadError.cancelled)
  }
}

private final class StreamMultipartUploadTaskState {
  let bodyFactory: StreamMultipartUploadBodyStreamFactory
  let progressThrottler: StreamMultipartUploadProgressThrottler
  let task: URLSessionUploadTask
  let uploadId: String
  var completion:
    ((Result<StreamMultipartUploadResponse, Error>) -> Void)?
  var response: HTTPURLResponse?
  var responseData = Data()
  var responseDataError: Error?

  init(
    bodyFactory: StreamMultipartUploadBodyStreamFactory,
    progressThrottler: StreamMultipartUploadProgressThrottler,
    task: URLSessionUploadTask,
    uploadId: String,
    completion: @escaping (Result<StreamMultipartUploadResponse, Error>) -> Void
  ) {
    self.bodyFactory = bodyFactory
    self.progressThrottler = progressThrottler
    self.task = task
    self.uploadId = uploadId
    self.completion = completion
  }
}

final class StreamMultipartUploadManager: NSObject {
  static let shared = StreamMultipartUploadManager()
  private let maxResponseBodyBytes = 1_048_576
  private let maxConcurrentUploads = min(max(ProcessInfo.processInfo.activeProcessorCount, 2), 4)

  private lazy var session: URLSession = {
    let delegateQueue = OperationQueue()
    delegateQueue.maxConcurrentOperationCount = 1
    delegateQueue.qualityOfService = .userInitiated
    let configuration = URLSessionConfiguration.ephemeral
    configuration.httpMaximumConnectionsPerHost = maxConcurrentUploads
    configuration.waitsForConnectivity = false
    return URLSession(configuration: configuration, delegate: self, delegateQueue: delegateQueue)
  }()
  private lazy var uploadLimiter = StreamMultipartUploadConcurrencyLimiter(
    maxConcurrentUploads: maxConcurrentUploads
  )

  private let lock = NSLock()
  private var cancelledUploadIds = Set<String>()
  private var statesByTaskIdentifier = [Int: StreamMultipartUploadTaskState]()
  private var taskIdentifiersByUploadId = [String: Int]()

  func cancel(uploadId: String) {
    lock.lock()
    cancelledUploadIds.insert(uploadId)
    let taskIdentifier = taskIdentifiersByUploadId[uploadId]
    let task: URLSessionUploadTask?
    if let taskIdentifier {
      task = statesByTaskIdentifier[taskIdentifier]?.task
    } else {
      task = nil
    }
    lock.unlock()

    task?.cancel()
  }

  func uploadMultipart(
    uploadId: String,
    url: String,
    method: String,
    headers: [String: String],
    parts: [[String: Any]],
    progress: [String: Any]?,
    timeoutMs: TimeInterval?,
    onProgress: @escaping (Int64, Int64?) -> Void
  ) async throws -> StreamMultipartUploadResponse {
    let request = try parseRequest(
      uploadId: uploadId,
      url: url,
      method: method,
      headers: headers,
      parts: parts,
      progress: progress,
      timeoutMs: timeoutMs
    )

    try throwIfCancelled(uploadId: uploadId)
    let bodyFactory = try await StreamMultipartUploadBodyStreamFactory.create(parts: request.parts)
    try throwIfCancelled(uploadId: uploadId)
    var urlRequest = URLRequest(url: request.url)
    urlRequest.httpMethod = request.method
    if let timeoutMs = request.timeoutMs, timeoutMs > 0 {
      urlRequest.timeoutInterval = timeoutMs / 1_000
    }

    request.headers.forEach { key, value in
      if
        key.caseInsensitiveCompare("Content-Type") == .orderedSame ||
        key.caseInsensitiveCompare("Content-Length") == .orderedSame
      {
        return
      }
      urlRequest.setValue(value, forHTTPHeaderField: key)
    }

    urlRequest.setValue(
      "multipart/form-data; boundary=\(bodyFactory.boundary)",
      forHTTPHeaderField: "Content-Type"
    )

    if let contentLength = bodyFactory.contentLength {
      urlRequest.setValue(String(contentLength), forHTTPHeaderField: "Content-Length")
    }

    let progressThrottler =
      StreamMultipartUploadProgressThrottler(options: request.progress, onProgress: onProgress)
    try await uploadLimiter.acquire()

    return try await withCheckedThrowingContinuation { continuation in
      let task = session.uploadTask(withStreamedRequest: urlRequest)
      let state = StreamMultipartUploadTaskState(
        bodyFactory: bodyFactory,
        progressThrottler: progressThrottler,
        task: task,
        uploadId: uploadId
      ) { result in
        Task {
          await self.uploadLimiter.release()
        }
        continuation.resume(with: result)
      }

      guard register(state) else {
        task.cancel()
        Task {
          await self.uploadLimiter.release()
        }
        continuation.resume(throwing: StreamMultipartUploadError.cancelled)
        return
      }

      task.resume()
    }
  }

  private func parseRequest(
    uploadId: String,
    url: String,
    method: String,
    headers: [String: String],
    parts: [[String: Any]],
    progress: [String: Any]?,
    timeoutMs: TimeInterval?
  ) throws -> StreamMultipartUploadRequest {
    guard let parsedURL = URL(string: url) else {
      throw StreamMultipartUploadError.invalidURL(url)
    }

    let uploadParts = try parts.enumerated().map { index, rawPart -> StreamMultipartUploadPart in
      guard let fieldName = rawPart["fieldName"] as? String else {
        throw StreamMultipartUploadError.invalidRequest(
          "Multipart part \(index) is missing fieldName"
        )
      }

      guard let kind = rawPart["kind"] as? String else {
        throw StreamMultipartUploadError.invalidRequest("Multipart part \(index) is missing kind")
      }

      switch kind {
      case "text":
        guard let value = rawPart["value"] as? String else {
          throw StreamMultipartUploadError.invalidRequest(
            "Multipart text part \(index) is missing value"
          )
        }
        return .text(
          StreamMultipartTextPart(fieldName: fieldName, value: value)
        )
      case "file":
        guard let uri = rawPart["uri"] as? String else {
          throw StreamMultipartUploadError.invalidRequest(
            "Multipart file part \(index) is missing uri"
          )
        }
        guard let fileName = rawPart["fileName"] as? String else {
          throw StreamMultipartUploadError.invalidRequest(
            "Multipart file part \(index) is missing fileName"
          )
        }
        return .file(
          StreamMultipartFilePart(
            fieldName: fieldName,
            fileName: fileName,
            mimeType: rawPart["mimeType"] as? String,
            uri: uri
          )
        )
      default:
        throw StreamMultipartUploadError.invalidRequest("Unsupported multipart kind: \(kind)")
      }
    }

    if !uploadParts.contains(where: {
      if case .file = $0 {
        return true
      }
      return false
    }) {
      throw StreamMultipartUploadError.invalidRequest(
        "Multipart upload must contain at least one file part"
      )
    }

    let progressOptions = StreamMultipartUploadProgressOptions(
      count: progress?["count"] as? Int ?? (progress?["count"] as? NSNumber)?.intValue,
      intervalMs: progress?["intervalMs"] as? Double ?? (progress?["intervalMs"] as? NSNumber)?.doubleValue
    )

    let parsedTimeoutMs = timeoutMs.flatMap { $0 > 0 ? $0 : nil }

    return StreamMultipartUploadRequest(
      headers: headers,
      method: method,
      parts: uploadParts,
      progress: progress == nil ? nil : progressOptions,
      timeoutMs: parsedTimeoutMs,
      uploadId: uploadId,
      url: parsedURL
    )
  }

  private func throwIfCancelled(uploadId: String) throws {
    lock.lock()
    let wasCancelled = cancelledUploadIds.remove(uploadId) != nil
    lock.unlock()

    if wasCancelled {
      throw StreamMultipartUploadError.cancelled
    }
  }

  private func register(_ state: StreamMultipartUploadTaskState) -> Bool {
    lock.lock()
    if cancelledUploadIds.remove(state.uploadId) != nil {
      lock.unlock()
      return false
    }

    statesByTaskIdentifier[state.task.taskIdentifier] = state
    taskIdentifiersByUploadId[state.uploadId] = state.task.taskIdentifier
    lock.unlock()
    return true
  }

  private func removeState(taskIdentifier: Int) -> StreamMultipartUploadTaskState? {
    lock.lock()
    let state = statesByTaskIdentifier.removeValue(forKey: taskIdentifier)
    if let uploadId = state?.uploadId {
      if taskIdentifiersByUploadId[uploadId] == taskIdentifier {
        taskIdentifiersByUploadId.removeValue(forKey: uploadId)
      }
      cancelledUploadIds.remove(uploadId)
    }
    lock.unlock()
    return state
  }

  private func state(taskIdentifier: Int) -> StreamMultipartUploadTaskState? {
    lock.lock()
    let state = statesByTaskIdentifier[taskIdentifier]
    lock.unlock()
    return state
  }
}

extension StreamMultipartUploadManager: URLSessionDataDelegate, URLSessionTaskDelegate {
  func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    didReceive data: Data
  ) {
    guard let state = state(taskIdentifier: dataTask.taskIdentifier) else {
      return
    }

    if state.responseData.count + data.count > maxResponseBodyBytes {
      state.responseDataError = StreamMultipartUploadError.responseBodyTooLarge(maxResponseBodyBytes)
      dataTask.cancel()
      return
    }

    state.responseData.append(data)
  }

  func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    state(taskIdentifier: dataTask.taskIdentifier)?.response = response as? HTTPURLResponse
    completionHandler(.allow)
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didCompleteWithError error: Error?
  ) {
    guard let state = removeState(taskIdentifier: task.taskIdentifier) else {
      return
    }

    if let error {
      if let responseDataError = state.responseDataError {
        state.completion?(.failure(responseDataError))
        state.completion = nil
        return
      }

      let nsError = error as NSError

      if nsError.domain == NSURLErrorDomain, nsError.code == NSURLErrorCancelled {
        state.completion?(.failure(StreamMultipartUploadError.cancelled))
      } else {
        state.completion?(.failure(nsError))
      }
      state.completion = nil
      return
    }

    guard let response = state.response else {
      state.completion?(.failure(StreamMultipartUploadError.missingHTTPResponse))
      state.completion = nil
      return
    }

    let headers =
      response.allHeaderFields.reduce(into: [String: String]()) { partialResult, entry in
        guard let key = entry.key as? String else {
          return
        }

        let value = String(describing: entry.value)
        if let existingValue = partialResult[key] {
          partialResult[key] = "\(existingValue), \(value)"
        } else {
          partialResult[key] = value
        }
      }

    let body = String(decoding: state.responseData, as: UTF8.self)

    state.completion?(
      .success(
        StreamMultipartUploadResponse(
          body: body,
          headers: headers,
          status: response.statusCode,
          statusText: HTTPURLResponse.localizedString(forStatusCode: response.statusCode)
        )
      )
    )
    state.completion = nil
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    didSendBodyData bytesSent: Int64,
    totalBytesSent: Int64,
    totalBytesExpectedToSend: Int64
  ) {
    let total: Int64?
    if totalBytesExpectedToSend > 0 {
      total = totalBytesExpectedToSend
    } else {
      total = nil
    }

    state(taskIdentifier: task.taskIdentifier)?.progressThrottler.dispatch(
      loaded: totalBytesSent,
      total: total
    )
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    needNewBodyStream completionHandler: @escaping (InputStream?) -> Void
  ) {
    completionHandler(state(taskIdentifier: task.taskIdentifier)?.bodyFactory.makeStream())
  }
}
