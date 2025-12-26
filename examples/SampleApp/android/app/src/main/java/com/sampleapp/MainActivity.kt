package com.sampleapp

import android.os.Build
import android.os.Bundle
import android.view.View
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)

    if (Build.VERSION.SDK_INT >= 35) {
      val rootView = findViewById<View>(android.R.id.content)

      // Keep the original padding so we can restore it when IME closes
      val initial = Insets.of(
        rootView.paddingLeft,
        rootView.paddingTop,
        rootView.paddingRight,
        rootView.paddingBottom
      )

      ViewCompat.setOnApplyWindowInsetsListener(rootView) { v, insets ->
        // Only apply IME (keyboard) to avoid breaking safe-area libs or double-padding system bars.
        val ime = insets.getInsets(WindowInsetsCompat.Type.ime())

        v.updatePadding(
          left = initial.left,
          top = initial.top,
          right = initial.right,
          bottom = initial.bottom + ime.bottom
        )

        // IMPORTANT: don't consume — allow insets to propagate to RN & safe-area-context
        insets
      }

      // Make sure we get an initial insets dispatch
    }
  }

  override fun getMainComponentName(): String = "SampleApp"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
