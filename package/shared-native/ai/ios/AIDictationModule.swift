import Foundation
import Speech
import AVFoundation
import React

/**
 * A sink for dictation events emitted from the native module.
 *
 * Implemented on the Obj-C++ TurboModule side (NativeAIDictationSpecBase subclass),
 * which forwards these calls into React Native’s event system via codegen.
 *
 * All payloads are plain `NSDictionary` objects so they can be passed directly
 * to the generated `emitOn<name>` helpers on iOS.
 */
@objc public protocol AIDictationEventSink {
    func emitOnState(_ value: NSDictionary)
    func emitOnResult(_ value: NSDictionary)
    func emitOnError(_ value: NSDictionary)
}

@objc(AIDictationModule)
public class AIDictationModule: NSObject {

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    /**
     * The logical module name exposed to JS.
     *
     * This must stay in sync with the TurboModule spec name so that
     * `NativeAIDictation` (JS) binds to this native implementation.
     */
    static let NAME = "NativeAIDictation"

    // High-level dictation state labels. These are emitted to JS via
    // the `state` field as part of a `type: "state"` event payload.
    private let STATE_IDLE      = "idle"
    private let STATE_STARTING  = "starting"
    private let STATE_LISTENING = "listening"
    private let STATE_STOPPING  = "stopping"

    // Error codes used in `type: "error"` events.
    private let ERROR_NO_PERMISSION = "NO_PERMISSION"
    private let ERROR_NOT_AVAILABLE = "NOT_AVAILABLE"
    private let ERROR_INTERNAL      = "INTERNAL_ERROR"

    /// Default maximum allowed silence (in milliseconds) before auto-stopping.
    private let DEFAULT_SILENCE_TIMEOUT_MS: Double = 2500.0

    // -------------------------------------------------------------------------
    // Internal state
    // -------------------------------------------------------------------------

    // AVFoundation/SpeechKit primitives driving the recognition session.
    private let audioEngine = AVAudioEngine()
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?

    // Runtime configuration and state of the current dictation session.
    private var isListening: Bool = false
    private var interimResultsEnabled: Bool = true
    private var currentLocale: Locale = .current
    private var silenceTimeoutMs: Double = 2500.0
    private var lastSpeechTimeMs: Double = 0.0

    // Timer used for the simple silence monitor.
    private var silenceTimer: Timer?

    // -------------------------------------------------------------------------
    // Event emitter plumbing
    // -------------------------------------------------------------------------

    /**
     * Event sink provided by the Obj-C TurboModule wrapper.
     *
     * The Obj-C class sets this to itself and forwards
     * calls into the codegen-generated `emitOn<name>`
     * helpers, which in turn send events to JS.
     */
    @objc public weak var eventSink: AIDictationEventSink?

    /**
     * Convenience entry point wired from Obj-C if needed.
     *
     * This signature exists so Objective-C can call
     * `[_impl startWithOptions:options eventEmitter:self]` without having
     * to construct Swift-specific types. Internally it just forwards to
     * the primary `start(_:)` implementation.
     */
    @objc(startWithOptions:eventEmitter:)
    public func startWithOptions(_ options: NSDictionary?, eventEmitter: NSObject) {
        start(options)
    }

    // -------------------------------------------------------------------------
    // NativeAIDictationSpec API
    // -------------------------------------------------------------------------

    /**
     * Starts a new dictation session with the given options.
     *
     * - No-ops if a session is already active
     * - Validates microphone + speech recognition permissions
     * - On success, configures and starts `AVAudioEngine` + `SFSpeechRecognizer`
     *   and arms a basic silence monitor
     *
     * Expected `options` keys (all optional):
     *
     * - `interimResults` (`Bool`, default `true`):
     *      Whether to emit partial / interim results while the user is speaking.
     *
     * - `language` (`String`, BCP-47 tag):
     *      Locale identifier (e.g. `"en-US"`). Falls back to `Locale.current`
     *      if omitted or blank.
     *
     * - `silenceTimeoutMs` (`Double`):
     *      Maximum allowed silence, in milliseconds, before auto-stopping.
     *      Falls back to `DEFAULT_SILENCE_TIMEOUT_MS` if missing or invalid.
     */
    @objc
    public func start(_ options: NSDictionary?) {
        if isListening {
            return
        }

        emitState(STATE_STARTING)

        // Runtime configuration derived from options.
        interimResultsEnabled = (options?["interimResults"] as? Bool) ?? true

        if let languageTag = options?["language"] as? String,
           !languageTag.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            currentLocale = Locale(identifier: languageTag)
        } else {
            currentLocale = .current
        }

        if let silenceOpt = options?["silenceTimeoutMs"] as? Double, silenceOpt > 0 {
            silenceTimeoutMs = silenceOpt
        } else {
            silenceTimeoutMs = DEFAULT_SILENCE_TIMEOUT_MS
        }

        // Permissions
        if !hasAudioPermission() {
            // If permissions are missing, request them and resolve via callback.
            requestPermissions { granted in
                if !granted {
                    self.emitError(
                        self.ERROR_NO_PERMISSION,
                        message: "Microphone or speech recognition permission not granted."
                    )
                    self.emitState(self.STATE_IDLE)
                }
            }
            return
        }

        // Availability
        guard let recognizer = SFSpeechRecognizer(locale: currentLocale), recognizer.isAvailable else {
            emitError(
                ERROR_NOT_AVAILABLE,
                message: "Speech recognition is not available for this locale or on this device."
            )
            emitState(STATE_IDLE)
            return
        }

        speechRecognizer = recognizer

        // Configure and start the audio engine + recognition task on the main thread.
        DispatchQueue.main.async {
            do {
                try self.setupAudioSession()
                try self.startRecognition()
            } catch {
                self.isListening = false
                self.emitState(self.STATE_IDLE)
                self.emitError(
                    self.ERROR_INTERNAL,
                    message: "Failed to start recognition: \(error.localizedDescription)"
                )
            }
        }
    }

    /**
     * Requests a graceful stop of the current dictation session.
     *
     * - No-ops if we are not currently listening
     * - Calls `endAudio()` on the recognition request, allowing
     *   `SFSpeechRecognizer` to deliver final results before terminating
     *
     * Final state transitions are handled via the recognition task callback
     * (`finishRecognitionSession()` or the error branch).
     */
    @objc
    public func stop() {
        if !isListening {
            return
        }

        emitState(STATE_STOPPING)
        stopSilenceMonitor()

        DispatchQueue.main.async {
            self.recognitionRequest?.endAudio()
        }
    }

    /**
     * Immediately cancels the current dictation session.
     *
     * - No-ops if we are not currently listening
     * - Stops the audio engine and cancels the recognition task
     * - Resets all internal state and emits `STATE_IDLE`
     *
     * Use this when the session should be aborted (e.g. user cancelled) rather
     * than gracefully completed.
     */
    @objc
    public func cancel() {
        if !isListening {
            return
        }

        stopSilenceMonitor()

        DispatchQueue.main.async {
            self.stopAudioEngine()
            self.recognitionTask?.cancel()
            self.recognitionTask = nil
            self.recognitionRequest = nil
            self.isListening = false
            self.emitState(self.STATE_IDLE)
        }
    }

    /**
     * Synchronously reports whether a dictation session is currently active.
     *
     * This is exposed to JS as a sync method so callers can quickly check
     * recording state without waiting on an event.
     */
    @objc
    public func isRecording() -> Bool {
        return isListening
    }

    // -------------------------------------------------------------------------
    // Internal setup / teardown
    // -------------------------------------------------------------------------

    /**
     * Configures the shared `AVAudioSession` for recording.
     *
     * - Uses `.record` category and `.measurement` mode for best recognition
     *   quality.
     * - Ducks other audio and notifies other sessions on deactivation.
     *
     * Throws if the session cannot be configured or activated.
     */
    private func setupAudioSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.record, mode: .measurement, options: [.duckOthers])
        try session.setActive(true, options: .notifyOthersOnDeactivation)
    }

    /**
     * Starts a fresh `SFSpeechRecognitionTask` and connects it to `AVAudioEngine`.
     *
     * Responsibilities:
     * - Cleans up any previous recognition task
     * - Creates a new `SFSpeechAudioBufferRecognitionRequest`
     * - Installs an input node tap to feed audio buffers into the request
     *
     * The recognition task callback:
     * - Emits interim and final transcripts via `emitResult(...)`
     * - Advances the silence timer on non-empty results
     * - On final results, calls `finishRecognitionSession()`
     * - On error, emits an error event, resets state, and tears down the
     *   engine / task
     */
    private func startRecognition() throws {
        // Clean up any previous task
        recognitionTask?.cancel()
        recognitionTask = nil

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = interimResultsEnabled
        recognitionRequest = request

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)

        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) {
            [weak self] (buffer, _) in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()

        lastSpeechTimeMs = currentTimeMs()
        isListening = true
        emitState(STATE_LISTENING)

        startSilenceMonitor()

        recognitionTask = speechRecognizer?.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }

            if let result = result {
                let text = result.bestTranscription.formattedString
                if !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    self.lastSpeechTimeMs = self.currentTimeMs()
                    self.emitResult(text: text, isFinal: result.isFinal)
                }

                if result.isFinal {
                    self.finishRecognitionSession()
                }
            }

            if let error = error {
                self.stopSilenceMonitor()
                self.isListening = false
                self.emitError(
                    self.ERROR_INTERNAL,
                    message: "Speech recognizer error: \(error.localizedDescription)"
                )
                self.emitState(self.STATE_IDLE)
                self.stopAudioEngine()
                self.recognitionTask = nil
                self.recognitionRequest = nil
            }
        }
    }

    /**
     * Handles the normal end-of-session flow after a final recognition result.
     *
     * - Stops the silence monitor
     * - Marks `isListening = false`
     * - Emits `STATE_IDLE`
     * - Stops the audio engine and clears recognition objects
     */
    private func finishRecognitionSession() {
        stopSilenceMonitor()
        isListening = false
        emitState(STATE_IDLE)
        stopAudioEngine()
        recognitionTask = nil
        recognitionRequest = nil
    }

    /**
     * Fully tears down the recognizer and audio engine and resets state.
     *
     * Intended for hard cleanup paths (e.g. deinit, React instance teardown).
     * Ensures we:
     * - stop the silence monitor
     * - stop and detach taps from the audio engine
     * - cancel and nil out the recognition task / request
     * - release the `SFSpeechRecognizer` instance
     * - emit `STATE_IDLE`
     */
    private func cleanupRecognizer() {
        stopSilenceMonitor()
        DispatchQueue.main.async {
            self.stopAudioEngine()
            self.recognitionTask?.cancel()
            self.recognitionTask = nil
            self.recognitionRequest = nil
            self.speechRecognizer = nil
            self.isListening = false
            self.emitState(self.STATE_IDLE)
        }
    }

    /**
     * Stops the audio engine and removes any installed tap on the input node.
     */
    private func stopAudioEngine() {
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
    }

    // -------------------------------------------------------------------------
    // Permissions / silence monitor
    // -------------------------------------------------------------------------

    /**
     * Returns `true` if both microphone and speech recognition permissions
     * are already granted.
     *
     * This is a simple synchronous check used before starting recognition.
     */
    private func hasAudioPermission() -> Bool {
        let micAllowed = AVAudioSession.sharedInstance().recordPermission == .granted
        let speechAllowed = SFSpeechRecognizer.authorizationStatus() == .authorized
        return micAllowed && speechAllowed
    }

    /**
     * Requests microphone + speech recognition permissions.
     *
     * The completion handler is invoked on the main thread with `true`
     * only if both:
     * - `AVAudioSession` record permission is granted
     * - `SFSpeechRecognizer` authorization status is `.authorized`
     */
    private func requestPermissions(completion: @escaping (Bool) -> Void) {
        let audioSession = AVAudioSession.sharedInstance()

        audioSession.requestRecordPermission { micGranted in
            SFSpeechRecognizer.requestAuthorization { status in
                let speechGranted = (status == .authorized)
                DispatchQueue.main.async {
                    completion(micGranted && speechGranted)
                }
            }
        }
    }

    /**
     * Starts (or restarts) a rudimentary silence monitor.
     *
     * Periodically checks the time since the last speech activity and if the
     * elapsed time exceeds `silenceTimeoutMs` while still listening, calls `stop()`.
     *
     * The timer runs on the main run loop in `.common` mode so that it continues
     * to fire during typical UI interactions.
     */
    private func startSilenceMonitor() {
        stopSilenceMonitor()

        guard silenceTimeoutMs > 0 else { return }

        silenceTimer = Timer.scheduledTimer(withTimeInterval: 0.3, repeats: true) { [weak self] _ in
            guard let self = self, self.isListening else { return }

            let elapsed = self.currentTimeMs() - self.lastSpeechTimeMs
            if elapsed >= self.silenceTimeoutMs {
                self.stop()
            }
        }
        if let timer = silenceTimer {
            RunLoop.main.add(timer, forMode: .common)
        }
    }

    /**
     * Stops the silence monitor by invalidating any pending timer.
     */
    private func stopSilenceMonitor() {
        silenceTimer?.invalidate()
        silenceTimer = nil
    }

    /**
     * Returns the current wall-clock time in milliseconds.
     *
     * Used to track the last time non-empty speech was observed so that the
     * silence monitor can auto-stop idle sessions.
     */
    private func currentTimeMs() -> Double {
        return Date().timeIntervalSince1970 * 1000.0
    }

    // -------------------------------------------------------------------------
    // Event helpers
    // -------------------------------------------------------------------------

    /**
     * Emits a dictation result event to JS.
     *
     * Payload fields:
     * - `text` (`String`): recognized transcript
     * - `isFinal` (`Bool`): `true` for final results, `false` for interim
     */
    private func emitResult(text: String, isFinal: Bool) {
        let payload: NSDictionary = [
            "text": text,
            "isFinal": isFinal
        ]
        eventSink?.emitOnResult(payload)
    }

    /**
     * Emits a state change event to JS.
     *
     * Payload fields:
     * - `state` (`String`): one of `"idle"`, `"starting"`, `"listening"`, `"stopping"`
     */
    private func emitState(_ state: String) {
        let payload: NSDictionary = [
            "state": state
        ]
        eventSink?.emitOnState(payload)
    }

    /**
     * Emits a generic error event to JS with a code and message.
     *
     * Payload fields:
     * - `code` (`String`): internal error code (e.g. `NO_PERMISSION`, `NOT_AVAILABLE`)
     * - `message` (`String`): human-readable description for logging / debugging
     */
    private func emitError(_ code: String, message: String) {
        let payload: NSDictionary = [
            "code": code,
            "message": message
        ]
        eventSink?.emitOnError(payload)
    }
}
