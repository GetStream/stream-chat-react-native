package com.streamchatreactnative

import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.StreamMessageListViewManagerDelegate
import com.facebook.react.viewmanagers.StreamMessageListViewManagerInterface

/**
 * Fabric manager for `StreamMessageListView` (Android, New Arch only).
 *
 * Mirrors [StreamShimmerViewManager]: a [ViewGroupManager] with a codegen delegate. Fabric mounts the
 * children directly into [StreamMessageListLayout], which owns the scrolling.
 */
class StreamMessageListViewManager : ViewGroupManager<StreamMessageListLayout>(),
  StreamMessageListViewManagerInterface<StreamMessageListLayout> {
  private val delegate = StreamMessageListViewManagerDelegate(this)

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): StreamMessageListLayout =
    StreamMessageListLayout(reactContext)

  override fun getDelegate(): ViewManagerDelegate<StreamMessageListLayout> = delegate

  override fun setInverted(view: StreamMessageListLayout, value: Boolean) {
    // TODO: bottom-anchored layout. No-op for now.
  }

  override fun setContentHeight(view: StreamMessageListLayout, value: Double) {
    view.setContentHeightDip(value)
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
    mapOf(
      StreamMessageListScrollEvent.EVENT_NAME to mapOf("registrationName" to "onStreamScroll"),
    )

  companion object {
    const val REACT_CLASS = "StreamMessageListView"
  }
}
