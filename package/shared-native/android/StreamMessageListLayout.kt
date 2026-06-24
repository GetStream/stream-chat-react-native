package com.streamchatreactnative

import android.content.Context
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
 * it handles touch drag + fling, scrolls its Fabric-mounted children, and emits an RN-shaped scroll
 * event (`onStreamScroll`) so the JS layer can drive pagination / viewability / windowing. It owns
 * ONLY scrolling — children are laid out and drawn by Fabric. The scroll range is the furthest child
 * bottom (the JS full-height spacer drives it).
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

  init {
    clipChildren = true
    isVerticalScrollBarEnabled = true
  }

  /** Scrollable content height = furthest child bottom (the JS full-height spacer drives this). */
  private fun contentHeight(): Int {
    var bottom = 0
    for (i in 0 until childCount) {
      bottom = max(bottom, getChildAt(i).bottom)
    }
    return bottom
  }

  private fun maxScrollY(): Int = max(0, contentHeight() - height)

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
          // maxY is intentionally unbounded. maxScrollY() is UNDERESTIMATED while the rows below
          // are unmeasured (they fall back to the height estimate), so binding the fling to it made
          // OverScroller truncate the deceleration curve to land on that short max — a fast downward
          // fling got "cut" mid-velocity. Letting it decelerate by pure physics and clamping each
          // frame in computeScroll() to the LIVE maxScrollY() (which grows as those rows mount and
          // measure) lets the fling ride the revealed content to the true bottom. Upward stays exact
          // because minY = 0.
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
      // Clamp to the LIVE maxScrollY() every frame: the fling target is unbounded (see ACTION_UP),
      // so this is what keeps it inside the content as rows below mount and the range grows.
      scrollTo(0, scroller.currY.coerceIn(0, maxScrollY()))
      postInvalidateOnAnimation()
    }
  }

  override fun onScrollChanged(l: Int, t: Int, oldl: Int, oldt: Int) {
    super.onScrollChanged(l, t, oldl, oldt)
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
        PixelUtil.toDIPFromPixel(contentHeight().toFloat()).toDouble(),
        PixelUtil.toDIPFromPixel(height.toFloat()).toDouble(),
      ),
    )
  }
}
