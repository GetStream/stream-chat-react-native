package com.streamchatreactnative

import android.content.Context
import android.graphics.Canvas
import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.ViewConfiguration
import android.widget.OverScroller
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.views.view.ReactViewGroup
import kotlin.math.abs
import kotlin.math.max

/**
 * Native host for `StreamMessageListView` — the custom message list's scroll engine (Android, New
 * Arch only).
 *
 * A [ReactViewGroup] with a self-contained vertical scroller ([OverScroller] + [VelocityTracker]):
 * touch drag + fling, scrolls its Fabric-mounted children, emits an RN-shaped scroll event
 * (`onStreamScroll`), and keeps the newest content pinned to the bottom (stick-to-bottom). The
 * scrollable content height is pushed from JS (`contentHeight`) — the JS layer owns the height model;
 * reading it from the spacer child's layout is unstable during windowing churn (it oscillates).
 */
class StreamMessageListLayout(context: Context) : ReactViewGroup(context) {
  private val scroller = OverScroller(context)
  private val config = ViewConfiguration.get(context)
  private val touchSlop = config.scaledTouchSlop
  private val minFlingVelocity = config.scaledMinimumFlingVelocity
  private val maxFlingVelocity = config.scaledMaximumFlingVelocity

  private var velocityTracker: VelocityTracker? = null
  private var lastTouchY = 0f
  private var isDragging = false
  private var stickToBottom = true
  private val stickThresholdPx = PixelUtil.toPixelFromDIP(120f)

  /** Authoritative content height (px), pushed from JS. Decoupled from the spacer child's layout,
   *  which reads stale right after a transaction and oscillates during windowing churn. */
  private var contentHeightPx = 0

  init {
    clipChildren = true
    isVerticalScrollBarEnabled = true
  }

  // --- content height + bottom anchoring (stick-to-bottom: newest content stays visible) ---

  fun setContentHeightDip(dp: Double) {
    val px = max(0, PixelUtil.toPixelFromDIP(dp.toFloat()).toInt())
    if (px == contentHeightPx) return
    contentHeightPx = px
    maintainBottomIfStuck()
  }

  private fun maxScrollY(): Int = max(0, contentHeightPx - height)

  /** Pin to the bottom while stuck. Driven by content-height pushes from JS and by size changes, so
   *  the newest content stays visible as the list grows or the viewport shrinks (e.g. keyboard). */
  internal fun maintainBottomIfStuck() {
    if (!stickToBottom) return
    val target = maxScrollY()
    if (scrollY != target) scrollTo(0, target)
  }

  /** Re-evaluate stick mode: stuck when at (or within a threshold of) the bottom. Scrolling up
   *  releases it; scrolling back to the bottom re-engages it. */
  private fun refreshStickToBottom() {
    val maxY = maxScrollY()
    stickToBottom = maxY <= 0 || scrollY >= maxY - stickThresholdPx
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    maintainBottomIfStuck()
  }

  // --- scroll engine ---

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    when (ev.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        lastTouchY = ev.y
        isDragging = false
        if (!scroller.isFinished) scroller.abortAnimation()
      }
      MotionEvent.ACTION_MOVE -> {
        if (!isDragging && abs(ev.y - lastTouchY) > touchSlop) {
          isDragging = true
          lastTouchY = ev.y
        }
      }
    }
    return isDragging
  }

  override fun onTouchEvent(ev: MotionEvent): Boolean {
    val tracker = velocityTracker ?: VelocityTracker.obtain().also { velocityTracker = it }
    tracker.addMovement(ev)
    when (ev.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        lastTouchY = ev.y
        if (!scroller.isFinished) scroller.abortAnimation()
      }
      MotionEvent.ACTION_MOVE -> {
        val dy = (lastTouchY - ev.y).toInt()
        lastTouchY = ev.y
        scrollTo(0, (scrollY + dy).coerceIn(0, maxScrollY()))
      }
      MotionEvent.ACTION_UP -> {
        tracker.computeCurrentVelocity(1000, maxFlingVelocity.toFloat())
        val velocityY = -tracker.yVelocity.toInt()
        if (abs(velocityY) > minFlingVelocity) {
          // maxY unbounded: let the fling decelerate by physics and clamp each frame in
          // computeScroll() to the live maxScrollY() (binding it directly truncated fast downward
          // flings mid-curve). Upward stays exact via minY = 0.
          scroller.fling(0, scrollY, 0, velocityY, 0, 0, 0, Int.MAX_VALUE)
          postInvalidateOnAnimation()
        }
        recycleVelocityTracker()
        isDragging = false
      }
      MotionEvent.ACTION_CANCEL -> {
        recycleVelocityTracker()
        isDragging = false
      }
    }
    return true
  }

  override fun computeScroll() {
    if (scroller.computeScrollOffset()) {
      scrollTo(0, scroller.currY.coerceIn(0, maxScrollY()))
      postInvalidateOnAnimation()
    }
  }

  override fun dispatchDraw(canvas: Canvas) {
    // clipChildren isn't honored during our custom scrollTo, so absolutely-positioned cells draw over
    // the header/footer (and clip raggedly at the top edge). Force-clip to the visible viewport: in
    // dispatchDraw the scroll is already applied, so the window in content coords is
    // [scrollX, scrollY] .. [scrollX + width, scrollY + height].
    canvas.clipRect(scrollX, scrollY, scrollX + width, scrollY + height)
    super.dispatchDraw(canvas)
  }

  override fun onScrollChanged(l: Int, t: Int, oldl: Int, oldt: Int) {
    super.onScrollChanged(l, t, oldl, oldt)
    refreshStickToBottom()
    emitScrollEvent()
  }

  private fun recycleVelocityTracker() {
    velocityTracker?.recycle()
    velocityTracker = null
  }

  // --- events to JS ---

  private fun emitScrollEvent() {
    val reactContext = context as? ReactContext ?: return
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id) ?: return
    dispatcher.dispatchEvent(
      StreamMessageListScrollEvent(
        UIManagerHelper.getSurfaceId(this),
        id,
        PixelUtil.toDIPFromPixel(scrollY.toFloat()).toDouble(),
        PixelUtil.toDIPFromPixel(contentHeightPx.toFloat()).toDouble(),
        PixelUtil.toDIPFromPixel(height.toFloat()).toDouble(),
      ),
    )
  }
}
