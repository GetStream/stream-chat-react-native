package com.streamchatreactnative

import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.streamchatreactnative.shared.StreamDateTimePicker

class StreamDateTimePickerModule(
  reactContext: ReactApplicationContext,
) : NativeStreamDateTimePickerSpec(reactContext),
  LifecycleEventListener {
  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = NAME

  override fun pick(options: ReadableMap, promise: Promise) {
    StreamDateTimePicker.pick(
      activity = reactApplicationContext.currentActivity,
      themes =
        StreamDateTimePicker.Themes(
          date = R.style.StreamChat_DateTimePicker_Date,
          time = R.style.StreamChat_DateTimePicker_Time,
        ),
      mode = options.getString("mode") ?: "date",
      value = options.getDouble("value").toLong(),
      minimumDate = options.optionalMillis("minimumDate"),
      maximumDate = options.optionalMillis("maximumDate"),
    ) { result -> promise.resolve(result?.toDouble()) }
  }

  override fun dismiss() {
    StreamDateTimePicker.dismissActive()
  }

  override fun onHostResume() {
    StreamDateTimePicker.dismissOrphans(reactApplicationContext.currentActivity)
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit

  // Dismisses a picker that is still shown when the module is invalidated, for example on reload.
  override fun invalidate() {
    reactApplicationContext.removeLifecycleEventListener(this)
    StreamDateTimePicker.dismissActive()
    super.invalidate()
  }

  private fun ReadableMap.optionalMillis(key: String): Long? =
    if (hasKey(key) && !isNull(key)) getDouble(key).toLong() else null

  companion object {
    const val NAME = "StreamDateTimePicker"
  }
}
