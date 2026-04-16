package com.streamchatreactnative.shared

import android.app.Activity
import android.os.Build
import android.view.HapticFeedbackConstants

object StreamHapticFeedback {
    fun trigger(activity: Activity?, type: String) {
        val view = activity?.window?.decorView ?: return
        val constant = when (type) {
            "impactLight" -> HapticFeedbackConstants.KEYBOARD_TAP
            "impactMedium" -> HapticFeedbackConstants.VIRTUAL_KEY
            "impactHeavy" -> HapticFeedbackConstants.LONG_PRESS
            "notificationSuccess" -> if (Build.VERSION.SDK_INT >= 30) {
                HapticFeedbackConstants.CONFIRM
            } else {
                HapticFeedbackConstants.VIRTUAL_KEY
            }
            "notificationWarning" -> HapticFeedbackConstants.VIRTUAL_KEY
            "notificationError" -> if (Build.VERSION.SDK_INT >= 30) {
                HapticFeedbackConstants.REJECT
            } else {
                HapticFeedbackConstants.LONG_PRESS
            }
            else -> HapticFeedbackConstants.CLOCK_TICK
        }
        view.performHapticFeedback(constant, HapticFeedbackConstants.FLAG_IGNORE_GLOBAL_SETTING)
    }
}
