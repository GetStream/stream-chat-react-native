package com.streamio.aicomponents.renderkit


import com.facebook.react.BaseReactPackage

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class RenderKitPackage : BaseReactPackage() {
  override fun createViewManagers(rc: ReactApplicationContext): List<ViewManager<*, *>> =
    listOf(PerfTextViewManager())

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == AIDictationModule.NAME) {
      AIDictationModule(reactContext)
    } else {
      null
    }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      AIDictationModule.NAME to ReactModuleInfo(
        name = AIDictationModule.NAME,
        className = AIDictationModule::class.java.name,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        isCxxModule = false,
        isTurboModule = true
      )
    )
  }
}