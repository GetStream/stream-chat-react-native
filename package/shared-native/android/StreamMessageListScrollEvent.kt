package com.streamchatreactnative

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Fabric scroll event for `StreamMessageListView`, shaped like RN's native scroll event
 * (contentOffset / contentSize / layoutMeasurement, all in DIP) so the JS layer can reuse the same
 * pagination / viewability math FlatList relies on. Registered as `onStreamScroll` in the manager.
 */
class StreamMessageListScrollEvent(
  surfaceId: Int,
  viewTag: Int,
  private val offsetY: Double,
  private val contentHeight: Double,
  private val viewportHeight: Double,
) : Event<StreamMessageListScrollEvent>(surfaceId, viewTag) {
  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putMap(
        "contentOffset",
        Arguments.createMap().apply {
          putDouble("x", 0.0)
          putDouble("y", offsetY)
        },
      )
      putMap(
        "contentSize",
        Arguments.createMap().apply {
          putDouble("width", 0.0)
          putDouble("height", contentHeight)
        },
      )
      putMap(
        "layoutMeasurement",
        Arguments.createMap().apply {
          putDouble("width", 0.0)
          putDouble("height", viewportHeight)
        },
      )
    }

  companion object {
    const val EVENT_NAME = "topStreamScroll"
  }
}
