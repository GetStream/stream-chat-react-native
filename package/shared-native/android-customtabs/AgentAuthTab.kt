package com.streamchatreactnative.shared.agent

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.result.ActivityResultLauncher

/**
 * No Auth Tab: the app builds below compileSdk 36 or AGP 8.9.1, which `androidx.browser` 1.9.0
 * needs, so sign-ins open in a Custom Tab. The `android-authtab` copy of this file has the Auth Tab.
 */
internal object AgentAuthTab {
  @Suppress("UNUSED_PARAMETER")
  fun isSupported(context: Context, browser: String): Boolean = false

  @Suppress("UNUSED_PARAMETER")
  fun launch(launcher: ActivityResultLauncher<Intent>, browser: String, uri: Uri, callbackScheme: String) {
    throw UnsupportedOperationException("Auth Tabs need androidx.browser 1.9.0.")
  }
}
