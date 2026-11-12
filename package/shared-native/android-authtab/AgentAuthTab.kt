package com.streamchatreactnative.shared.agent

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.result.ActivityResultLauncher
import androidx.browser.auth.AuthTabIntent
import androidx.browser.customtabs.CustomTabsClient

/**
 * The browser's Auth Tab, from `androidx.browser` 1.9.0. Compiled in when the app builds with
 * compileSdk 36 and AGP 8.9.1 or newer, which that version needs; otherwise the build takes the
 * `android-customtabs` copy of this file, and sign-ins open in a Custom Tab.
 */
internal object AgentAuthTab {
  fun isSupported(context: Context, browser: String): Boolean =
    CustomTabsClient.isAuthTabSupported(context, browser)

  fun launch(launcher: ActivityResultLauncher<Intent>, browser: String, uri: Uri, callbackScheme: String) {
    AuthTabIntent.Builder().build()
      .apply { intent.setPackage(browser) }
      .launch(launcher, uri, callbackScheme)
  }
}
