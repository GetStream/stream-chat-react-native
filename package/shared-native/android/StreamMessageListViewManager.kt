package com.streamchatreactnative

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * Fabric manager for `StreamMessageListView` (Android, New Arch only).
 *
 * The JS spec is `interfaceOnly: true` so a hand-written C++ ShadowNode/ComponentDescriptor
 * (android/src/main/jni/) can override codegen's default and report the scroll offset into the
 * shadow tree (getContentOriginOffset) — which Fabric's View.scrollTo-blind coordinate math
 * otherwise misses, breaking measureInWindow (overlay) + findNodeAtPoint (long-press) for
 * scrolled cells. `interfaceOnly` means codegen emits no ViewManager delegate, so props go
 * through @ReactProp and commands are dispatched manually. Fabric mounts children directly into
 * [StreamMessageListLayout], which owns the scrolling.
 */
class StreamMessageListViewManager : ViewGroupManager<StreamMessageListLayout>() {

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): StreamMessageListLayout =
    StreamMessageListLayout(reactContext)

  // Fabric hands the per-view StateWrapper here; stash it so the view can push its scroll offset
  // into the shadow node's State (drives getContentOriginOffset → correct measureInWindow + hit-test).
  override fun updateState(
    view: StreamMessageListLayout,
    props: ReactStylesDiffMap?,
    stateWrapper: StateWrapper?,
  ): Any? {
    view.stateWrapper = stateWrapper
    return null
  }

  @ReactProp(name = "inverted")
  fun setInverted(view: StreamMessageListLayout, value: Boolean) {
    // TODO: bottom-anchored layout. No-op for now.
  }

  @ReactProp(name = "contentHeight")
  fun setContentHeight(view: StreamMessageListLayout, value: Double) {
    view.setContentHeightDip(value)
  }

  // Net-new imperative command. With interfaceOnly there's no codegen delegate to parse args,
  // so dispatch manually. JS dispatches by name via codegenNativeCommands.
  override fun receiveCommand(
    view: StreamMessageListLayout,
    commandId: String,
    args: ReadableArray?,
  ) {
    when (commandId) {
      "scrollToOffset" -> {
        val offset = args?.getDouble(0) ?: return
        val animated = args.size() > 1 && args.getBoolean(1)
        view.scrollToOffsetDip(offset, animated)
      }
    }
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
    mapOf(
      StreamMessageListScrollEvent.EVENT_NAME to mapOf("registrationName" to "onStreamScroll"),
    )

  companion object {
    const val REACT_CLASS = "StreamMessageListView"
  }
}
