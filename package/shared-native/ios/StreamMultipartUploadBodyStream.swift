import Foundation

private enum StreamMultipartBodyElement {
  case data(Data)
  case file(URL)
}

/// Carries a body-production failure out of band.
///
/// A bound stream pair has no error channel: the only way the producer can signal failure is to
/// close the write end, which the server sees as a truncated body. Recording the real error here
/// lets the upload manager surface it instead of the generic transport error.
final class StreamMultipartBodyErrorBox: @unchecked Sendable {
  private let lock = NSLock()
  private var storedError: Error?

  var error: Error? {
    lock.lock()
    defer { lock.unlock() }
    return storedError
  }

  func record(_ error: Error) {
    lock.lock()
    defer { lock.unlock() }
    if storedError == nil {
      storedError = error
    }
  }
}

final class StreamMultipartUploadBodyStreamFactory {
  let boundary: String
  let contentLength: Int64?

  /// Set when the body of the **most recent** attempt could not be produced in full.
  ///
  /// `URLSession` can ask for a fresh body stream (redirect, auth retry) via
  /// `needNewBodyStream`. Each attempt therefore gets its own box and `makeStream()` installs it
  /// as the current one, so a failure recorded by an abandoned attempt — e.g. its reader going
  /// away because URLSession decided to retry — can never fail a later attempt that succeeds.
  var bodyError: Error? {
    boxLock.lock()
    defer { boxLock.unlock() }
    return currentErrorBox.error
  }

  private let boxLock = NSLock()
  private var currentErrorBox = StreamMultipartBodyErrorBox()
  private let elements: [StreamMultipartBodyElement]

  private init(
    boundary: String,
    contentLength: Int64?,
    elements: [StreamMultipartBodyElement]
  ) {
    self.boundary = boundary
    self.contentLength = contentLength
    self.elements = elements
  }

  static func create(parts: [StreamMultipartUploadPart]) async throws -> StreamMultipartUploadBodyStreamFactory {
    let boundary = "stream-upload-\(UUID().uuidString)"
    var elements = [StreamMultipartBodyElement]()
    var totalLength: Int64 = 0
    var canComputeLength = true

    for part in parts {
      switch part {
      case .text(let textPart):
        let data = multipartTextData(boundary: boundary, part: textPart)
        elements.append(.data(data))
        totalLength += Int64(data.count)
      case .file(let filePart):
        let resolvedPart = try await StreamMultipartUploadSourceResolver.resolve(filePart)
        let headerData = multipartFileHeaderData(boundary: boundary, part: resolvedPart)
        let footerData = "\r\n".data(using: .utf8) ?? Data()

        elements.append(.data(headerData))
        elements.append(.file(resolvedPart.fileURL))
        elements.append(.data(footerData))

        totalLength += Int64(headerData.count) + Int64(footerData.count)
        if let size = resolvedPart.size {
          totalLength += size
        } else {
          canComputeLength = false
        }
      }
    }

    let closingBoundary = "--\(boundary)--\r\n".data(using: .utf8) ?? Data()
    elements.append(.data(closingBoundary))
    totalLength += Int64(closingBoundary.count)

    return StreamMultipartUploadBodyStreamFactory(
      boundary: boundary,
      contentLength: canComputeLength ? totalLength : nil,
      elements: elements
    )
  }

  func makeStream() -> InputStream {
    var readStream: Unmanaged<CFReadStream>?
    var writeStream: Unmanaged<CFWriteStream>?

    CFStreamCreateBoundPair(
      kCFAllocatorDefault,
      &readStream,
      &writeStream,
      CFIndex(StreamMultipartBodyProducer.transferBufferSize)
    )

    // A fresh box per attempt; see `bodyError`.
    let errorBox = StreamMultipartBodyErrorBox()
    boxLock.lock()
    currentErrorBox = errorBox
    boxLock.unlock()

    guard
      let input = readStream?.takeRetainedValue() as InputStream?,
      let output = writeStream?.takeRetainedValue()
    else {
      errorBox.record(StreamMultipartUploadError.invalidRequest("Could not create a request body stream"))
      return InputStream(data: Data())
    }

    StreamMultipartBodyProducer(
      elements: elements,
      output: output,
      errorBox: errorBox
    ).start()

    return input
  }

  private static func multipartTextData(boundary: String, part: StreamMultipartTextPart) -> Data {
    let payload = [
      "--\(boundary)",
      "Content-Disposition: form-data; name=\(multipartQuotedParameter(part.fieldName))",
      "",
      part.value,
      "",
    ].joined(separator: "\r\n")

    return payload.data(using: .utf8) ?? Data()
  }

  private static func multipartFileHeaderData(
    boundary: String,
    part: StreamMultipartResolvedFilePart
  ) -> Data {
    let payload = [
      "--\(boundary)",
      "Content-Disposition: form-data; name=\(multipartQuotedParameter(part.fieldName)); filename=\(multipartQuotedParameter(part.fileName))",
      "Content-Type: \(part.mimeType)",
      "",
    ].joined(separator: "\r\n") + "\r\n"

    return payload.data(using: .utf8) ?? Data()
  }

  private static func multipartQuotedParameter(_ value: String) -> String {
    let escaped = value
      .replacingOccurrences(of: "\r", with: "%0D")
      .replacingOccurrences(of: "\n", with: "%0A")
      .replacingOccurrences(of: "\"", with: "%22")

    return "\"\(escaped)\""
  }
}

/// Feeds the write end of a `CFStreamCreateBoundPair` from the multipart element list.
///
/// The body is handed to `URLSession` as the *read* end of a Core Foundation bound stream pair
/// rather than as a hand-rolled `InputStream` subclass. That matters: CFNetwork drives an HTTP/1.1
/// request body through the `CFReadStream` client-callback machinery, and a plain `InputStream`
/// subclass cannot participate in it — it can never report end-of-stream. CFNetwork stops reading
/// as soon as `Content-Length` is satisfied, so with a subclass it never observed the end of the
/// body, never considered the request finished, and the task sat idle until it timed out (the
/// server had already answered 201). A real bound pair reports every event, and closing the write
/// end is what tells CFNetwork the body is complete.
///
/// The write end is driven by **GCD** (`CFWriteStreamSetDispatchQueue`) rather than a run loop, so
/// this owns no thread and cannot outlive its work.
private final class StreamMultipartBodyProducer {
  static let transferBufferSize = 64 * 1024

  private enum Refill {
    case filled
    case drained
    case failed(Error)
  }

  private let elements: [StreamMultipartBodyElement]
  private let output: CFWriteStream
  private let errorBox: StreamMultipartBodyErrorBox
  private let queue: DispatchQueue
  private let buffer = UnsafeMutablePointer<UInt8>.allocate(
    capacity: StreamMultipartBodyProducer.transferBufferSize
  )

  private var currentIndex = 0
  private var currentStream: InputStream?
  private var bufferOffset = 0
  private var bufferLength = 0
  private var isFinished = false
  /// Keeps the producer alive while the stream client holds an unretained pointer to it.
  private var selfRetain: StreamMultipartBodyProducer?

  init(
    elements: [StreamMultipartBodyElement],
    output: CFWriteStream,
    errorBox: StreamMultipartBodyErrorBox
  ) {
    self.elements = elements
    self.output = output
    self.errorBox = errorBox
    queue = DispatchQueue(
      label: "io.getstream.chat.multipart-upload-body",
      qos: .userInitiated
    )
  }

  deinit {
    buffer.deallocate()
  }

  func start() {
    selfRetain = self

    var context = CFStreamClientContext(
      version: 0,
      info: Unmanaged.passUnretained(self).toOpaque(),
      retain: nil,
      release: nil,
      copyDescription: nil
    )

    let events: CFOptionFlags = CFStreamEventType.canAcceptBytes.rawValue
      | CFStreamEventType.errorOccurred.rawValue
      | CFStreamEventType.endEncountered.rawValue

    let didSetClient = CFWriteStreamSetClient(
      output,
      events,
      { _, event, info in
        guard let info else {
          return
        }
        Unmanaged<StreamMultipartBodyProducer>.fromOpaque(info)
          .takeUnretainedValue()
          .handle(event)
      },
      &context
    )

    guard didSetClient else {
      // No callbacks will ever arrive; finishing here is safe because the dispatch queue has not
      // been attached yet, so nothing else can be running.
      finish(error: writeStreamError() ?? StreamMultipartUploadError.invalidRequest(
        "Could not observe the request body stream"
      ))
      return
    }

    // Deliver client callbacks on our serial queue instead of scheduling on a run loop, so the
    // producer needs no thread of its own and GCD owns its lifetime.
    CFWriteStreamSetDispatchQueue(output, queue)

    guard CFWriteStreamOpen(output) else {
      // The queue is attached now, so tear down on it to stay single-threaded.
      queue.async { [self] in
        finish(error: writeStreamError() ?? StreamMultipartUploadError.invalidRequest(
          "Could not open the request body stream"
        ))
      }
      return
    }
  }

  /// The write end's own error, when Core Foundation has one to give.
  private func writeStreamError() -> Error? {
    CFWriteStreamCopyError(output) as Error?
  }

  // MARK: - Callbacks (always on `queue`)

  private func handle(_ event: CFStreamEventType) {
    switch event {
    case .canAcceptBytes:
      pump()
    case .errorOccurred:
      // Usually the reader going away (a cancelled upload), but it can be a genuine write-side
      // failure — record whatever CF gives us. Cancellation still wins in the manager, which
      // checks `NSURLErrorCancelled` first.
      finish(error: writeStreamError())
    case .endEncountered:
      finish(error: nil)
    default:
      break
    }
  }

  private func pump() {
    while !isFinished, CFWriteStreamCanAcceptBytes(output) {
      if bufferOffset >= bufferLength {
        switch refill() {
        case .filled:
          break
        case .drained:
          finish(error: nil)
          return
        case .failed(let error):
          finish(error: error)
          return
        }
      }

      let written = CFWriteStreamWrite(
        output,
        buffer + bufferOffset,
        bufferLength - bufferOffset
      )

      if written > 0 {
        bufferOffset += written
        continue
      }

      if written == 0 {
        // Backpressure, NOT end of body: `CFWriteStreamCanAcceptBytes` may answer true without
        // knowing, and the pair reports 0 when it is full. The unwritten remainder stays in
        // `buffer` at `bufferOffset`, so the next `.canAcceptBytes` resumes exactly here.
        // Closing the stream here would silently truncate the body.
        return
      }

      // A negative write is itself the failure signal — do not depend on CF having an error
      // object, or the failure degrades into the clean stream close this refactor exists to
      // disambiguate.
      finish(error: writeStreamError() ?? StreamMultipartUploadError.invalidRequest(
        "Could not write the request body stream"
      ))
      return
    }
  }

  /// Fills `buffer` from the next available element.
  private func refill() -> Refill {
    while true {
      if currentStream == nil {
        guard currentIndex < elements.count else {
          return .drained
        }

        let element = elements[currentIndex]
        currentIndex += 1

        switch element {
        case .data(let data):
          currentStream = InputStream(data: data)
        case .file(let url):
          guard let stream = InputStream(url: url) else {
            return .failed(StreamMultipartUploadError.unreadableFile(url.path))
          }
          currentStream = stream
        }

        guard let stream = currentStream else {
          return .drained
        }

        stream.open()

        if stream.streamStatus == .error {
          return .failed(stream.streamError ?? StreamMultipartUploadError.unreadableFile(elementPath()))
        }
      }

      guard let stream = currentStream else {
        return .drained
      }

      let read = stream.read(buffer, maxLength: StreamMultipartBodyProducer.transferBufferSize)

      if read > 0 {
        bufferOffset = 0
        bufferLength = read
        return .filled
      }

      let readError = read < 0 ? (stream.streamError ?? StreamMultipartUploadError.unreadableFile(elementPath())) : nil
      stream.close()
      currentStream = nil

      if let readError {
        return .failed(readError)
      }
    }
  }

  private func elementPath() -> String {
    guard currentIndex > 0, case .file(let url) = elements[currentIndex - 1] else {
      return ""
    }
    return url.path
  }

  private func finish(error: Error?) {
    guard !isFinished else {
      return
    }

    isFinished = true

    if let error {
      errorBox.record(error)
    }

    currentStream?.close()
    currentStream = nil

    // Unregister before dropping the retain so no callback can arrive against a dead pointer.
    CFWriteStreamSetClient(output, 0, nil, nil)
    CFWriteStreamSetDispatchQueue(output, nil)
    // Closing the write end is what surfaces end-of-stream on the read end.
    CFWriteStreamClose(output)

    selfRetain = nil
  }
}
