import UIKit

@objcMembers
public final class StreamHapticFeedback: NSObject {
    public static func trigger(_ type: String) {
        switch type {
        case "impactLight":
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case "impactMedium":
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        case "impactHeavy":
            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        case "notificationSuccess":
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        case "notificationWarning":
            UINotificationFeedbackGenerator().notificationOccurred(.warning)
        case "notificationError":
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        default:
            UISelectionFeedbackGenerator().selectionChanged()
        }
    }
}
