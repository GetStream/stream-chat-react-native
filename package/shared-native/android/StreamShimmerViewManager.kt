package com.streamchatreactnative

import androidx.annotation.NonNull
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.viewmanagers.StreamShimmerViewManagerDelegate
import com.facebook.react.viewmanagers.StreamShimmerViewManagerInterface

/**
 * Fabric manager for StreamShimmerView.
 *
 * It creates the native shimmer layout, maps React props to native setters, and exposes child
 * management methods so Fabric can mount and unmount children correctly inside this container.
 * The manager rechecks animation state after prop transactions and disables shimmer when a view
 * instance is dropped as a defensive cleanup step for recycled or unmounted views. Because the
 * shimmer view wraps React children, this must remain a real ViewGroupManager as using a non-group
 * manager can fail in Fabric mounting paths at runtime.
 */
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
    // Prop batches can change visibility/enabled/colors together, so we re-evaluate the animator once
    // after every transaction to keep state consistent and avoid duplicate start/stop churn.
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

  override fun setDuration(view: StreamShimmerFrameLayout, duration: Int) {
    view.setDuration(duration)
  }

  override fun setGradientColor(view: StreamShimmerFrameLayout, color: Int?) {
    view.setGradientColor(color ?: DEFAULT_GRADIENT_COLOR)
  }

  override fun onDropViewInstance(@NonNull view: StreamShimmerFrameLayout) {
    super.onDropViewInstance(view)
    // Defensive shutdown for recycled/unmounted views; avoids animator leaks in list-heavy screens.
    view.setShimmerEnabled(false)
  }

  companion object {
    const val REACT_CLASS = "StreamShimmerView"
    private const val DEFAULT_BASE_COLOR = 0x00FFFFFF
    private const val DEFAULT_GRADIENT_COLOR = 0x59FFFFFF
  }
}
