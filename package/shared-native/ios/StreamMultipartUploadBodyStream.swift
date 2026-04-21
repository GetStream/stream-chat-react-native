import Foundation

private enum StreamMultipartBodyElement {
  case data(Data)
  case file(URL)
}

final class StreamMultipartUploadBodyStreamFactory {
  let boundary: String
  let contentLength: Int64?

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
    StreamMultipartSequentialInputStream(elements: elements)
  }

  private static func multipartTextData(boundary: String, part: StreamMultipartTextPart) -> Data {
    let payload = [
      "--\(boundary)",
      "Content-Disposition: form-data; name=\"\(part.fieldName)\"",
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
      "Content-Disposition: form-data; name=\"\(part.fieldName)\"; filename=\"\(part.fileName)\"",
      "Content-Type: \(part.mimeType)",
      "",
    ].joined(separator: "\r\n") + "\r\n"

    return payload.data(using: .utf8) ?? Data()
  }
}

private final class StreamMultipartSequentialInputStream: InputStream {
  private let elements: [StreamMultipartBodyElement]
  private var currentIndex = 0
  private var currentStream: InputStream?
  private weak var internalDelegate: StreamDelegate?
  private var internalStatus: Stream.Status = .notOpen
  private var internalError: Error?
  private var scheduledRunLoops: [(runLoop: RunLoop, mode: RunLoop.Mode)] = []

  init(elements: [StreamMultipartBodyElement]) {
    self.elements = elements
    super.init(data: Data())
  }

  override var delegate: StreamDelegate? {
    get {
      internalDelegate
    }
    set {
      internalDelegate = newValue
      currentStream?.delegate = newValue
    }
  }

  override var hasBytesAvailable: Bool {
    guard internalStatus != .closed, internalStatus != .error else {
      return false
    }

    if let currentStream, currentStream.hasBytesAvailable {
      return true
    }

    return currentIndex < elements.count
  }

  override var streamError: Error? {
    internalError
  }

  override var streamStatus: Stream.Status {
    internalStatus
  }

  override func open() {
    guard internalStatus == .notOpen else {
      return
    }

    internalStatus = .opening
    advanceStreamIfNeeded()
    internalStatus = currentStream == nil ? .atEnd : .open
  }

  override func close() {
    currentStream?.close()
    currentStream = nil
    internalStatus = .closed
  }

  override func schedule(in aRunLoop: RunLoop, forMode mode: RunLoop.Mode) {
    scheduledRunLoops.append((runLoop: aRunLoop, mode: mode))
    currentStream?.schedule(in: aRunLoop, forMode: mode)
  }

  override func remove(from aRunLoop: RunLoop, forMode mode: RunLoop.Mode) {
    scheduledRunLoops.removeAll { $0.runLoop == aRunLoop && $0.mode == mode }
    currentStream?.remove(from: aRunLoop, forMode: mode)
  }

  override func read(_ buffer: UnsafeMutablePointer<UInt8>, maxLength len: Int) -> Int {
    guard internalStatus != .closed else {
      return 0
    }

    if internalStatus == .notOpen {
      open()
    }

    while true {
      guard let currentStream else {
        internalStatus = .atEnd
        return 0
      }

      let bytesRead = currentStream.read(buffer, maxLength: len)

      if bytesRead > 0 {
        internalStatus = .open
        return bytesRead
      }

      if bytesRead < 0 {
        internalError = currentStream.streamError
        internalStatus = .error
        return -1
      }

      currentStream.close()
      self.currentStream = nil
      advanceStreamIfNeeded()

      if self.currentStream == nil {
        internalStatus = .atEnd
        return 0
      }
    }
  }

  private func advanceStreamIfNeeded() {
    guard currentStream == nil else {
      return
    }

    while currentIndex < elements.count {
      let nextElement = elements[currentIndex]
      currentIndex += 1

      let nextStream: InputStream?
      switch nextElement {
      case .data(let data):
        nextStream = InputStream(data: data)
      case .file(let url):
        nextStream = InputStream(url: url)
      }

      if let nextStream {
        nextStream.delegate = internalDelegate
        for scheduled in scheduledRunLoops {
          nextStream.schedule(in: scheduled.runLoop, forMode: scheduled.mode)
        }
        nextStream.open()
        currentStream = nextStream
        return
      }
    }
  }
}
