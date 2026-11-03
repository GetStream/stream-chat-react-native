package com.streamchatreactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.streamchatreactnative.shared.agent.AIAgentController

/**
 * The `AIAgent` TurboModule used by the `ai-components` agent views: this install's identifier
 * and the sign-ins of tool calls. The implementation is shared with the other SDK package; see
 * [AIAgentController].
 */
class AIAgentModule(
  reactContext: ReactApplicationContext,
) : NativeAIAgentSpec(reactContext) {
  private val controller = AIAgentController(reactContext)

  override fun getName(): String = NAME

  override fun initialize() {
    super.initialize()
    controller.initialize()
  }

  override fun invalidate() {
    super.invalidate()
    controller.invalidate()
  }

  override fun installId(): String = controller.installId()

  override fun openAuthSession(url: String, callbackScheme: String, promise: Promise) =
    controller.openAuthSession(url, callbackScheme, promise)

  companion object {
    const val NAME = AIAgentController.NAME
  }
}
