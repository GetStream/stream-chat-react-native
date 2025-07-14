package com.typescriptmessaging;

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import android.os.Bundle
import android.os.Build
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)

        if (Build.VERSION.SDK_INT >= 35) {
            val rootView = findViewById<View>(android.R.id.content)


          ViewCompat.setOnApplyWindowInsetsListener(rootView) { view, insets ->
              val bars = insets.getInsets(
                  WindowInsetsCompat.Type.systemBars()
                          or WindowInsetsCompat.Type.displayCutout()
                          or WindowInsetsCompat.Type.ime() // adding the ime's height
              )
              rootView.updatePadding(
                   left = bars.left,
                   top = bars.top,
                   right = bars.right,
                   bottom = bars.bottom
               )
              WindowInsetsCompat.CONSUMED
          }
        }
      }
    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "TypeScriptMessaging"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
