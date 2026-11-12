package com.streamchatreactnative.shared.agent

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsIntent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import java.io.File
import java.lang.ref.WeakReference
import java.util.Locale
import java.util.UUID

/**
 * This install's identifier and the sign-ins of tool calls, for the `AIAgent` TurboModule of both
 * SDK packages (each package's codegen generates its own `NativeAIAgentSpec`), which forward
 * their calls here.
 *
 * A sign-in opens in the browser's Auth Tab where the app is built with one (see
 * `AgentAuthTab`) and the browser has it: the tab hands the page's redirect to the callback scheme
 * straight back. Otherwise it opens in a Custom Tab: the redirect then reaches the app as a new
 * intent, and coming back to the app without one means the person closed the tab.
 */
class AIAgentController(private val reactContext: ReactApplicationContext) :
  ActivityEventListener,
  LifecycleEventListener {
  companion object {
    const val NAME = "AIAgent"
    private const val INSTALL_ID_FILE = "io.getstream.ai.client-id"
    private const val ERROR = "ai_agent_auth_session"
  }

  /** The sign-in open now. One runs at a time; opening another ends this one. */
  private class SignIn(
    val callbackScheme: String,
    val promise: Promise,
    /** The key the Auth Tab's result comes back under, or null for a Custom Tab. */
    val resultKey: String?,
  ) {
    /** Where the Auth Tab's result is received, and the activity it is registered on. */
    var launcher: ActivityResultLauncher<Intent>? = null
    var host: WeakReference<Activity>? = null

    /** Whether the person left the app for the Custom Tab, so coming back means it was closed. */
    var left = false
  }

  private var signIn: SignIn? = null
  private var launches = 0

  fun initialize() {
    reactContext.addActivityEventListener(this)
    reactContext.addLifecycleEventListener(this)
  }

  fun invalidate() {
    reactContext.removeActivityEventListener(this)
    reactContext.removeLifecycleEventListener(this)
    finish("")
  }

  /**
   * This install's identifier, created on first use and kept until the app's data is cleared.
   * It is not backed up, so a device restored from a backup gets its own.
   */
  @Synchronized
  fun installId(): String {
    // noBackupFilesDir: a restored device must not answer calls meant for the old one.
    val file = File(reactContext.applicationContext.noBackupFilesDir, INSTALL_ID_FILE)
    if (file.exists()) file.readText().takeIf { it.isNotBlank() }?.let { return it }
    val created = "android-" + UUID.randomUUID().toString().uppercase(Locale.ROOT)
    file.writeText(created)
    return created
  }

  fun openAuthSession(url: String, callbackScheme: String, promise: Promise) {
    val activity = reactContext.currentActivity
    if (activity == null) {
      promise.reject(ERROR, "There's no activity to open the sign-in from.")
      return
    }
    activity.runOnUiThread {
      finish("")
      val uri = Uri.parse(url)
      val browser = CustomTabsClient.getPackageName(activity, null)
      try {
        if (activity is ComponentActivity &&
          browser != null &&
          AgentAuthTab.isSupported(activity, browser)
        ) {
          openAuthTab(activity, browser, uri, callbackScheme, promise)
        } else {
          signIn = SignIn(callbackScheme, promise, resultKey = null)
          CustomTabsIntent.Builder().build().launchUrl(activity, uri)
        }
      } catch (error: Exception) {
        signIn = null
        promise.reject(ERROR, error.message ?: "The sign-in couldn't be opened.", error)
      }
    }
  }

  private fun openAuthTab(
    activity: ComponentActivity,
    browser: String,
    uri: Uri,
    callbackScheme: String,
    promise: Promise,
  ) {
    val current = SignIn(callbackScheme, promise, resultKey = "stream-chat-ai-sign-in-${launches++}")
    signIn = current
    val launcher = receiveResult(current, activity)
    AgentAuthTab.launch(launcher, browser, uri, callbackScheme)
  }

  // Registers where `current`'s Auth Tab result is received, on `activity`. It is registered for
  // this sign-in alone and dropped once it answers, since a TurboModule can't register before the
  // activity starts, as `AuthTabIntent.registerActivityResultLauncher` requires. Auth Tab's own
  // contract only passes the intent through and reads the result's data, which is what
  // `StartActivityForResult` does. An activity recreated while the tab is open, such as one
  // rotated or reclaimed in the background, keeps the result under the same key until it is
  // registered on it again, which `onHostResume` does.
  private fun receiveResult(current: SignIn, activity: ComponentActivity): ActivityResultLauncher<Intent> {
    current.launcher?.unregister()
    current.host = WeakReference(activity)
    val launcher = activity.activityResultRegistry.register(
      current.resultKey!!,
      ActivityResultContracts.StartActivityForResult(),
    ) { result ->
      if (signIn !== current) return@register
      when (result.resultCode) {
        // Auth Tab's RESULT_OK and RESULT_CANCELED are the activity's own.
        Activity.RESULT_OK -> finish(result.data?.data?.toString() ?: "")
        Activity.RESULT_CANCELED -> finish("")
        else -> fail("The sign-in didn't complete.")
      }
    }
    current.launcher = launcher
    return launcher
  }

  private fun finish(callback: String) {
    val current = signIn ?: return
    signIn = null
    current.launcher?.unregister()
    current.promise.resolve(callback)
  }

  private fun fail(message: String) {
    val current = signIn ?: return
    signIn = null
    current.launcher?.unregister()
    current.promise.reject(ERROR, message)
  }

  // The Custom Tab's redirect to the callback scheme reaches the app as a new intent, which
  // arrives before the activity resumes.
  override fun onNewIntent(intent: Intent) {
    val current = signIn ?: return
    val data = intent.data ?: return
    if (current.resultKey == null && data.scheme.equals(current.callbackScheme, ignoreCase = true)) {
      finish(data.toString())
    }
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?,
  ) = Unit

  override fun onHostPause() {
    signIn?.takeIf { it.resultKey == null }?.left = true
  }

  override fun onHostResume() {
    val current = signIn ?: return
    if (current.resultKey != null) {
      // The activity was recreated while the Auth Tab was open: its result waits on this one.
      val activity = reactContext.currentActivity
      if (activity is ComponentActivity && current.host?.get() !== activity) {
        receiveResult(current, activity)
      }
      return
    }
    if (current.left) finish("")
  }

  override fun onHostDestroy() = Unit
}
