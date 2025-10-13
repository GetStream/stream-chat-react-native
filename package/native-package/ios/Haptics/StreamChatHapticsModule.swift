enum NotificationFeedbackType: String {
  case success
  case warning
  case error

  var hapticType: UINotificationFeedbackGenerator.FeedbackType {
    switch self {
      case .success: return .success
      case .warning: return .warning
      case .error: return .error
    }
  }
}

enum ImpactFeedbackType: String {
  case light
  case medium
  case heavy
  case soft
  case rigid

  var hapticType: UIImpactFeedbackGenerator.FeedbackStyle {
    switch self {
      case .light: return .light
      case .medium: return .medium
      case .heavy: return .heavy
      case .soft: return .soft
      case .rigid: return .rigid
    }
  }
}

@objc(StreamChatHapticsModule)
public class StreamChatHapticsModule: NSObject {
  @objc
  func notificationFeedback(_ typeString: String) {
    guard let type = NotificationFeedbackType(rawValue: typeString) else {
      return
    }

    DispatchQueue.main.async {
      let generator = UINotificationFeedbackGenerator()
      generator.prepare()
      generator.notificationOccurred(type.hapticType)
    }
  }

  @objc
  func impactFeedback(_ typeString: String) {
    guard let type = ImpactFeedbackType(rawValue: typeString) else {
      return
    }

    DispatchQueue.main.async {
      let generator = UIImpactFeedbackGenerator(style: type.hapticType)
      generator.prepare()
      generator.impactOccurred()
    }
  }

  @objc
  func selectionFeedback() {
    DispatchQueue.main.async {
      let generator = UISelectionFeedbackGenerator()
      generator.prepare()
      generator.selectionChanged()
    }
  }
}
