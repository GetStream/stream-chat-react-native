package com.streamio.aicomponents.renderkit

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

class AIDictationModule(
    private val reactContext: ReactApplicationContext,
) : NativeAIDictationSpec(reactContext), LifecycleEventListener {

    // ---------------------------------------------------------------------------
    // Module constants
    // ---------------------------------------------------------------------------

    companion object {
        const val NAME = "AIDictation"

        private const val STATE_IDLE = "idle"
        private const val STATE_STARTING = "starting"
        private const val STATE_LISTENING = "listening"
        private const val STATE_STOPPING = "stopping"

        private const val ERROR_NO_PERMISSION = "NO_PERMISSION"
        private const val ERROR_NOT_AVAILABLE = "NOT_AVAILABLE"
        private const val ERROR_INTERNAL = "INTERNAL_ERROR"
        private const val ERROR_ANDROID = "ANDROID_ERROR"

        private const val DEFAULT_SILENCE_TIMEOUT_MS = 2500L
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private var speechRecognizer: SpeechRecognizer? = null

    private val isListening = AtomicBoolean(false)
    private var interimResultsEnabled: Boolean = true
    private var currentLocale: Locale = Locale.getDefault()
    private var silenceTimeoutMs: Long = DEFAULT_SILENCE_TIMEOUT_MS
    private var lastSpeechTimeMs: Long = 0L

    private var silenceRunnable: Runnable? = null

    override fun getName(): String = NAME

    override fun initialize() {
        super.initialize()
        reactContext.addLifecycleEventListener(this)
    }

    override fun invalidate() {
        super.invalidate()
        reactContext.removeLifecycleEventListener(this)
        cleanupRecognizer()
    }

    // ---------------------------------------------------------------------------
    // NativeAIDictationSpec API implementation
    // ---------------------------------------------------------------------------

    /**
     * Starts a new dictation session with the given options.
     *
     * - No-ops if a session is already active
     * - Verifies the RECORD_AUDIO permission and speech recognition availability before starting
     * - On success, configures and starts [SpeechRecognizer] as well as the silence monitor
     *
     * @param options Optional configuration map:
     * - `interimResults` (boolean, default `true`) – whether to emit partial/interim results
     * - `language` (string, BCP-47 tag) – language/locale for recognition; falls back to
     *   [Locale.getDefault] if omitted or blank
     * - `silenceTimeoutMs` (number) – max allowed silence in milliseconds before
     *   auto-stopping; falls back to [DEFAULT_SILENCE_TIMEOUT_MS] if missing or invalid
     */
    @ReactMethod
    override fun start(options: ReadableMap?) {
        if (isListening.get()) return

        emitState(STATE_STARTING)

        interimResultsEnabled = options?.getBooleanSafe("interimResults") ?: true

        val languageTag = options?.getStringSafe("language")
        currentLocale = if (languageTag.isNullOrBlank()) {
            Locale.getDefault()
        } else {
            Locale.forLanguageTag(languageTag)
        }

        val silenceOptMs = options?.getDoubleSafe("silenceTimeoutMs")
        silenceTimeoutMs = if (silenceOptMs != null && silenceOptMs > 0) {
            silenceOptMs.toLong()
        } else {
            DEFAULT_SILENCE_TIMEOUT_MS
        }

        if (!hasAudioPermission()) {
            emitError(
                ERROR_NO_PERMISSION,
                "RECORD_AUDIO permission not granted. Request it in JS before calling start().",
            )
            emitState(STATE_IDLE)
            return
        }

        if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
            emitError(
                ERROR_NOT_AVAILABLE,
                "Speech recognition is not available on this device.",
            )
            emitState(STATE_IDLE)
            return
        }

        mainHandler.post {
            try {
                setupRecognizerIfNeeded()

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(
                        RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                        RecognizerIntent.LANGUAGE_MODEL_FREE_FORM,
                    )
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, currentLocale.toLanguageTag())
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, interimResultsEnabled)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
                    putExtra(RecognizerIntent.EXTRA_PROMPT, "Listening...")
                }

                lastSpeechTimeMs = System.currentTimeMillis()
                isListening.set(true)
                emitState(STATE_LISTENING)

                speechRecognizer?.startListening(intent)
                startSilenceMonitor()
            } catch (t: Throwable) {
                isListening.set(false)
                emitState(STATE_IDLE)
                emitError(
                    ERROR_INTERNAL,
                    "Failed to start recognition: ${t.message ?: t.javaClass.simpleName}",
                )
            }
        }
    }

    /**
     * Requests a graceful stop of the current dictation session.
     *
     * - No-ops if we are not currently listening
     * - Emits [STATE_STOPPING] so JS can show a "stopping" state
     * - Stops the silence monitor
     * - On the main thread, calls [SpeechRecognizer.stopListening] to let
     *   Android finish the current utterance and deliver final results
     *
     * The recognizer will transition to [STATE_IDLE] via [onResults] or [onError].
     */
    @ReactMethod
    override fun stop() {
        if (!isListening.get()) return

        emitState(STATE_STOPPING)
        stopSilenceMonitor()

        mainHandler.post {
            try {
                speechRecognizer?.stopListening()
            } catch (_: Throwable) {
                // ignore
            }
        }
    }

    /**
     * Immediately cancels the current dictation session.
     *
     * - No-ops if we are not currently listening
     * - Stops the silence monitor
     * - On the main thread, calls [SpeechRecognizer.cancel] to abort recognition
     * - Regardless of the cancel outcome, marks `isListening` false and emits
     *   [STATE_IDLE] so JS knows dictation has fully stopped
     */
    @ReactMethod
    override fun cancel() {
        if (!isListening.get()) return

        stopSilenceMonitor()

        mainHandler.post {
            try {
                speechRecognizer?.cancel()
            } catch (_: Throwable) {
                // ignore
            } finally {
                isListening.set(false)
                emitState(STATE_IDLE)
            }
        }
    }

    /**
     * Synchronously reports whether a dictation session is currently active.
     *
     * Exposed as a blocking synchronous method to JS so callers can quickly check
     * recording state without going through an async event.
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    override fun isRecording(): Boolean {
        return isListening.get()
    }

    // ---------------------------------------------------------------------------
    // React Native host lifecycle callbacks
    // ---------------------------------------------------------------------------


    /**
     * Called when the React Native host Activity is resumed (app comes to foreground).
     *
     * We currently don’t need to resume or re-attach anything for dictation here,
     * so this is intentionally a no-op.
     */
    override fun onHostResume() = Unit

    /**
     * Called when the React Native host Activity is paused (app goes to background
     * or another Activity is shown on top).
     *
     * If we are actively listening for speech when this happens, we cancel the
     * current dictation session. This avoids:
     *
     * - Keeping the microphone active while the app is in the background
     * - Letting the platform speech recognizer run in an invalid/paused state
     *
     * `cancel()` is used instead of `stop()` so the partial utterance is treated as
     * aborted and not as a successfully completed transcription.
     */
    override fun onHostPause() {
        if (isListening.get()) {
            cancel()
        }
    }

    /**
     * Called when the React Native host Activity is being destroyed.
     *
     * This is the last chance to clean up any native resources held by the
     * speech recognizer (listeners, microphone, underlying platform objects).
     * Technically, we typically want to do this within React Native code itself,
     * (i.e hook cleanup) however that might not always be enough in certain
     * scenarios and we keep this as a safety measure to make sure any memory leaks
     * don't occur.
     */
    override fun onHostDestroy() {
        cleanupRecognizer()
    }

    // ---------------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------------

    /**
     * Creates (if needed) and configures the Android [SpeechRecognizer] instance.
     *
     * The recognizer is bound to the current [reactContext] and wired to forward
     * Android recognition callbacks into the JavaScript side via:
     *
     * - [emitResult] for partial and final transcription text
     * - [emitAndroidError] for platform error codes
     * - [emitState] to update the high-level dictation state (i.e IDLE vs LISTENING)
     *
     * Callback behavior:
     *
     * - [RecognitionListener.onError]:
     *   - Cleans up all relevant timers, resets the state to [STATE_IDLE] and emits a JS error event
     *
     * - [RecognitionListener.onResults]:
     *   - Considered to be the end of the listening session (happening natively, so not stopped or canceled)
     *   and extracts the best final transcript from [SpeechRecognizer.RESULTS_RECOGNITION]
     *
     * - [RecognitionListener.onPartialResults]:
     *   - Similar to [RecognitionListener.onResults], but only runs when interim results are enabled
     *   ([interimResultsEnabled] == true)
     *   - Will try to extract the best segmented transcript
     *
     * - All other callbacks ([onReadyForSpeech], [onBeginningOfSpeech], [onRmsChanged],
     *   [onBufferReceived], [onEndOfSpeech], [onEvent]) are currently treated as no-ops
     *
     * This method should be called before starting a new dictation session to ensure
     * that a configured [SpeechRecognizer] instance is available.
     */

    private fun setupRecognizerIfNeeded() {
        if (speechRecognizer != null) return

        val ctx = reactContext.currentActivity ?: reactContext

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) = Unit
                override fun onBeginningOfSpeech() = Unit
                override fun onRmsChanged(rmsdB: Float) = Unit
                override fun onBufferReceived(buffer: ByteArray?) = Unit
                override fun onEndOfSpeech() = Unit

                override fun onError(error: Int) {
                    stopSilenceMonitor()
                    isListening.set(false)
                    emitAndroidError(error)
                    emitState(STATE_IDLE)
                }

                override fun onResults(results: Bundle?) {
                    stopSilenceMonitor()
                    isListening.set(false)

                    val text = results
                        ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        ?.firstOrNull()
                        ?: ""

                    if (text.isNotBlank()) {
                        emitResult(text, true)
                    }
                    emitState(STATE_IDLE)
                }

                override fun onPartialResults(partialResults: Bundle?) {
                    if (!interimResultsEnabled) return

                    val text = partialResults
                        ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        ?.firstOrNull()
                        ?: ""

                    if (text.isNotBlank()) {
                        lastSpeechTimeMs = System.currentTimeMillis()
                        emitResult(text, false)
                    }
                }

                override fun onEvent(eventType: Int, params: Bundle?) = Unit
            })
        }
    }

    /**
     * Fully tears down the current [SpeechRecognizer] instance and resets dictation state.
     *
     * This should be called when we are done with speech recognition for the current
     * lifecycle of the host (e.g. `onHostDestroy`) or when we want to guarantee that
     * no recognizer resources are left hanging around.
     */
    private fun cleanupRecognizer() {
        stopSilenceMonitor()
        mainHandler.post {
            try {
                speechRecognizer?.setRecognitionListener(null)
                speechRecognizer?.destroy()
            } catch (_: Throwable) {
                // ignore
            } finally {
                speechRecognizer = null
                isListening.set(false)
                emitState(STATE_IDLE)
            }
        }
    }

    /**
     * Returns `true` if the app has the RECORD_AUDIO permission.
     */
    private fun hasAudioPermission(): Boolean {
        val granted = ContextCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.RECORD_AUDIO,
        )
        return granted == PackageManager.PERMISSION_GRANTED
    }

    /**
     * Starts (or restarts) a rudimentary silence monitor.
     *
     * Periodically checks the time since the last speech activity and if the
     * elapsed time exceeds [silenceTimeoutMs] while still listening, calls [stop].
     */
    private fun startSilenceMonitor() {
        stopSilenceMonitor()

        val runnable = object : Runnable {
            override fun run() {
                if (!isListening.get()) return

                val elapsed = System.currentTimeMillis() - lastSpeechTimeMs
                if (elapsed >= silenceTimeoutMs) {
                    stop()
                    return
                }

                mainHandler.postDelayed(this, 300L)
            }
        }

        silenceRunnable = runnable
        mainHandler.postDelayed(runnable, 300L)
    }

    /**
     * Stops the silence monitor by removing any pending callbacks.
     */
    private fun stopSilenceMonitor() {
        silenceRunnable?.let { mainHandler.removeCallbacks(it) }
        silenceRunnable = null
    }

    /**
     * Emits a dictation result event to JS.
     *
     * @param text    Transcribed text
     * @param isFinal Whether this result is final (`true`) or interim (`false`)
     */
    private fun emitResult(text: String, isFinal: Boolean) {
        val map = Arguments.createMap().apply {
            putString("text", text)
            putBoolean("isFinal", isFinal)
        }
        emitOnResult(map);
    }

    /**
     * Emits a state change event to JS (e.g. IDLE, LISTENING etc).
     */
    private fun emitState(state: String) {
        val map = Arguments.createMap().apply {
            putString("state", state)
        }
        emitOnState(map)
    }

    /**
     * Emits a generic error event to JS with a code and message.
     */
    private fun emitError(code: String, message: String) {
        val map = Arguments.createMap().apply {
            putString("code", code)
            putString("message", message)
        }
        emitOnError(map)
    }

    /**
     * Maps an Android SpeechRecognizer error code to a human-readable message
     * and emits it as a JS error event.
     */
    private fun emitAndroidError(errorCode: Int) {
        val msg = when (errorCode) {
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
            SpeechRecognizer.ERROR_CLIENT -> "Client side error"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
            SpeechRecognizer.ERROR_NETWORK -> "Network error"
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
            SpeechRecognizer.ERROR_NO_MATCH -> "No recognition result matched"
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "RecognitionService busy"
            SpeechRecognizer.ERROR_SERVER -> "Server error"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
            else -> "Unknown speech recognizer error ($errorCode)"
        }

        emitError(ERROR_ANDROID, msg)
    }

    private fun ReadableMap.getBooleanSafe(key: String): Boolean? =
        if (hasKey(key) && getType(key) == ReadableType.Boolean) getBoolean(key) else null

    private fun ReadableMap.getStringSafe(key: String): String? =
        if (hasKey(key) && getType(key) == ReadableType.String) getString(key) else null

    private fun ReadableMap.getDoubleSafe(key: String): Double? =
        if (hasKey(key) && getType(key) == ReadableType.Number) getDouble(key) else null
}
