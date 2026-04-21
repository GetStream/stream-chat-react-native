import Foundation

final class StreamMultipartUploadProgressThrottler {
  private let count: Int
  private let intervalMs: TimeInterval
  private let onProgress: (Int64, Int64?) -> Void
  private var emittedBucket = -1
  private var lastEventAt: TimeInterval = 0

  init(
    options: StreamMultipartUploadProgressOptions?,
    onProgress: @escaping (Int64, Int64?) -> Void
  ) {
    self.count = options?.count ?? 20
    self.intervalMs = options?.intervalMs ?? 16
    self.onProgress = onProgress
  }

  func dispatch(loaded: Int64, total: Int64?) {
    if let total, loaded >= total {
      onProgress(loaded, total)
      return
    }

    let now = Date().timeIntervalSince1970 * 1000
    let passesInterval = now - lastEventAt >= intervalMs
    let passesCount: Bool

    if count > 0, let total = total, total > 0 {
      let nextBucket = Int(floor((Double(loaded) / Double(total)) * Double(count)))
      if nextBucket > emittedBucket {
        emittedBucket = nextBucket
        passesCount = true
      } else {
        passesCount = false
      }
    } else {
      passesCount = true
    }

    guard passesInterval, passesCount else {
      return
    }

    lastEventAt = now
    onProgress(loaded, total)
  }
}
