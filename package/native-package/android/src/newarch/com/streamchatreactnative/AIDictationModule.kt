package com.streamchatreactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.streamchatreactnative.shared.dictation.AIDictationController

/**
 * The `AIDictation` TurboModule used by `ai-components` speech-to-text. The implementation is
 * shared with the other SDK package; see [AIDictationController].
 */
class AIDictationModule(
  reactContext: ReactApplicationContext,
) : NativeAIDictationSpec(reactContext) {
  private val controller =
    AIDictationController(reactContext) { eventName, payload ->
      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(eventName, payload)
    }

  override fun getName(): String = NAME

  override fun initialize() {
    super.initialize()
    controller.initialize()
  }

  override fun invalidate() {
    super.invalidate()
    controller.invalidate()
  }

  override fun start(options: ReadableMap?) = controller.start(options)

  override fun stop() = controller.stop()

  override fun cancel() = controller.cancel()

  override fun isRecording(): Boolean = controller.isRecording()

  override fun addListener(eventName: String) = Unit

  override fun removeListeners(count: Double) = Unit

  companion object {
    const val NAME = AIDictationController.NAME
  }
}
