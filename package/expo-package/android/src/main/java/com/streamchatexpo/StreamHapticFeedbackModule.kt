package com.streamchatexpo

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.streamchatreactnative.shared.StreamHapticFeedback

class StreamHapticFeedbackModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = NAME

    @ReactMethod
    fun triggerHaptic(type: String) {
        StreamHapticFeedback.trigger(currentActivity, type)
    }

    companion object {
        const val NAME = "StreamHapticFeedback"
    }
}
