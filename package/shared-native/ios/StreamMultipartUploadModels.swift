import Foundation

struct StreamMultipartUploadRequest {
  let headers: [String: String]
  let method: String
  let parts: [StreamMultipartUploadPart]
  let progress: StreamMultipartUploadProgressOptions?
  let timeoutMs: TimeInterval?
  let uploadId: String
  let url: URL
}

enum StreamMultipartUploadPart {
  case file(StreamMultipartFilePart)
  case text(StreamMultipartTextPart)
}

struct StreamMultipartFilePart {
  let fieldName: String
  let fileName: String
  let mimeType: String?
  let uri: String
}

struct StreamMultipartTextPart {
  let fieldName: String
  let value: String
}

struct StreamMultipartUploadProgressOptions {
  let count: Int?
  let intervalMs: TimeInterval?
}

struct StreamMultipartUploadResponse {
  let body: String
  let headers: [String: String]
  let status: Int
  let statusText: String?
}

enum StreamMultipartUploadError: LocalizedError {
  case cancelled
  case invalidRequest(String)
  case invalidURL(String)
  case missingHTTPResponse
  case responseBodyTooLarge(Int)
  case unreadableFile(String)
  case unsupportedSource(String)

  var errorDescription: String? {
    switch self {
    case .cancelled:
      return "Request aborted"
    case .invalidRequest(let message):
      return message
    case .invalidURL(let value):
      return "Invalid upload URL: \(value)"
    case .missingHTTPResponse:
      return "Upload completed without an HTTP response"
    case .responseBodyTooLarge(let maxBytes):
      return "Upload response body exceeded \(maxBytes) bytes"
    case .unreadableFile(let path):
      return "Unable to read upload file: \(path)"
    case .unsupportedSource(let uri):
      return "Unsupported upload URI: \(uri)"
    }
  }
}
