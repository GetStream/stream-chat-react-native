import AuthenticationServices
import Foundation
import UIKit

/// This install's identifier and the sign-ins of tool calls, for the `AIAgent` TurboModule
/// (`AIAgent.mm`). Ported from StreamChatAI's `AIClientIdentity` and `AIWebAuthentication`.
@objc(AIAgentModule)
public class AIAgentModule: NSObject {
    private static let installIdKey = "io.getstream.ai.client-id"

    /// The session open now. One sign-in runs at a time; opening another ends this one.
    private var session: ASWebAuthenticationSession?
    private var completion: ((String?, String?) -> Void)?
    private let anchor = PresentationAnchor()

    /// This install's identifier, created on first use. It is kept in a file left out of backups,
    /// as on Android, so a phone restored from another's backup never answers tool calls meant
    /// for that one. An id kept the way StreamChatAI keeps it, in UserDefaults, carries over, so a
    /// native app moving to React Native keeps its id.
    @objc public static func installId() -> String {
        let file = installIdFile()
        if let file, let saved = try? String(contentsOf: file, encoding: .utf8), !saved.isEmpty {
            return saved
        }
        let id = UserDefaults.standard.string(forKey: installIdKey) ?? "ios-" + UUID().uuidString
        guard let file, keep(id, in: file) else {
            // Without the file, UserDefaults keeps it, backed up as it is.
            UserDefaults.standard.set(id, forKey: installIdKey)
            return id
        }
        // The backups from now on don't carry it.
        UserDefaults.standard.removeObject(forKey: installIdKey)
        return id
    }

    // Application Support/io.getstream.ai/install-id.
    private static func installIdFile() -> URL? {
        guard let support = try? FileManager.default.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        ) else { return nil }
        return support.appendingPathComponent("io.getstream.ai", isDirectory: true)
            .appendingPathComponent("install-id")
    }

    // Writes `id` to `file`, left out of backups. Whether it did.
    private static func keep(_ id: String, in file: URL) -> Bool {
        do {
            try FileManager.default.createDirectory(
                at: file.deletingLastPathComponent(),
                withIntermediateDirectories: true
            )
            try id.write(to: file, atomically: true, encoding: .utf8)
            var values = URLResourceValues()
            values.isExcludedFromBackup = true
            var excluded = file
            try excluded.setResourceValues(values)
            return true
        } catch {
            try? FileManager.default.removeItem(at: file)
            return false
        }
    }

    /// Opens `url` in a web authentication session. `completion` gets the URL the page handed
    /// back to `callbackScheme`, nothing when the person closed the sheet, or an error when the
    /// session couldn't be opened.
    @objc public func openAuthSession(
        url: String,
        callbackScheme: String,
        completion: @escaping (String?, String?) -> Void
    ) {
        DispatchQueue.main.async {
            guard let target = URL(string: url) else {
                completion(nil, "The sign-in URL isn't valid.")
                return
            }
            // A sign-in still open is ended as closed; its session's own answer is then ignored.
            let previous = self.session
            self.finish(nil, error: nil)
            previous?.cancel()

            // Weak, so the session and its own callback don't hold each other.
            weak var opened: ASWebAuthenticationSession?
            let session = ASWebAuthenticationSession(url: target, callbackURLScheme: callbackScheme) { callback, error in
                let cancelled = (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin
                DispatchQueue.main.async {
                    guard let opened, self.session === opened else { return }
                    if let callback {
                        self.finish(callback.absoluteString, error: nil)
                    } else if cancelled {
                        self.finish(nil, error: nil)
                    } else {
                        self.finish(nil, error: error?.localizedDescription ?? "The sign-in couldn't be opened.")
                    }
                }
            }
            opened = session
            session.presentationContextProvider = self.anchor
            self.session = session
            self.completion = completion
            if !session.start() {
                self.finish(nil, error: "The sign-in couldn't be opened.")
            }
        }
    }

    // The session may answer after a start that failed, so each sign-in is answered once.
    private func finish(_ callback: String?, error: String?) {
        guard let completion else { return }
        self.completion = nil
        session = nil
        completion(callback, error)
    }
}

// Kept off `AIAgentModule`, whose conformances go in the generated Swift header that every
// Objective-C file of the pod imports without AuthenticationServices.
private final class PresentationAnchor: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        return scenes.flatMap(\.windows).first(where: \.isKeyWindow) ?? scenes.first?.windows.first ?? ASPresentationAnchor()
    }
}
