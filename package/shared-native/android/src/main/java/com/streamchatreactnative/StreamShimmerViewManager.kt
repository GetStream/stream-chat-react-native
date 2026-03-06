package com.streamchatreactnative

import androidx.annotation.NonNull
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.viewmanagers.StreamShimmerViewManagerDelegate
import com.facebook.react.viewmanagers.StreamShimmerViewManagerInterface

class StreamShimmerViewManager : ViewGroupManager<StreamShimmerFrameLayout>(),
  StreamShimmerViewManagerInterface<StreamShimmerFrameLayout> {
  private val delegate = StreamShimmerViewManagerDelegate(this)

  override fun getName(): String = REACT_CLASS

  @NonNull
  override fun createViewInstance(@NonNull reactContext: ThemedReactContext): StreamShimmerFrameLayout {
    val layout = StreamShimmerFrameLayout(reactContext)
    layout.updateAnimatorState()
    return layout
  }

  override fun onAfterUpdateTransaction(@NonNull view: StreamShimmerFrameLayout) {
    super.onAfterUpdateTransaction(view)
    view.updateAnimatorState()
  }

  override fun addView(parent: StreamShimmerFrameLayout, child: android.view.View, index: Int) {
    parent.addView(child, index)
  }

  override fun getChildAt(parent: StreamShimmerFrameLayout, index: Int): android.view.View {
    return parent.getChildAt(index)
  }

  override fun getChildCount(parent: StreamShimmerFrameLayout): Int {
    return parent.childCount
  }

  override fun removeViewAt(parent: StreamShimmerFrameLayout, index: Int) {
    parent.removeViewAt(index)
  }

  override fun getDelegate(): ViewManagerDelegate<StreamShimmerFrameLayout> = delegate

  override fun setEnabled(view: StreamShimmerFrameLayout, enabled: Boolean) {
    view.setShimmerEnabled(enabled)
  }

  override fun setBaseColor(view: StreamShimmerFrameLayout, color: Int?) {
    view.setBaseColor(color ?: DEFAULT_BASE_COLOR)
  }

  override fun setHighlightColor(view: StreamShimmerFrameLayout, color: Int?) {
    view.setHighlightColor(color ?: DEFAULT_HIGHLIGHT_COLOR)
  }

  override fun setGradientColor(view: StreamShimmerFrameLayout, color: Int?) {
    view.setGradientColor(color ?: DEFAULT_GRADIENT_COLOR)
  }

  override fun setGradientWidth(view: StreamShimmerFrameLayout, widthDp: Double) {
    view.setGradientWidth(PixelUtil.toPixelFromDIP(widthDp.toFloat()))
  }

  override fun setGradientHeight(view: StreamShimmerFrameLayout, heightDp: Double) {
    view.setGradientHeight(PixelUtil.toPixelFromDIP(heightDp.toFloat()))
  }

  override fun onDropViewInstance(@NonNull view: StreamShimmerFrameLayout) {
    super.onDropViewInstance(view)
    view.setShimmerEnabled(false)
  }

  companion object {
    const val REACT_CLASS = "StreamShimmerView"
    private const val DEFAULT_BASE_COLOR = 0x00FFFFFF
    private const val DEFAULT_HIGHLIGHT_COLOR = 0x59FFFFFF
    private const val DEFAULT_GRADIENT_COLOR = 0xFFFFFFFF.toInt()
  }
}
