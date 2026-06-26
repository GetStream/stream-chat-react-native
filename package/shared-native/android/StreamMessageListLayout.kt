package com.streamchatreactnative

import android.content.Context
import android.graphics.Canvas
import android.util.Log
import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewTreeObserver
import android.widget.OverScroller
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.StateWrapper
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
  private var lastFlingY = 0
  private var isDragging = false
  // True once the user has actually scrolled (dragged). Gates the initial-open re-pin (#5) so it can
  // never fire for a prepend — prepends require scrolling up, which flips this true.
  private var hasUserScrolled = false
  private var stickToBottom = true
  private val stickThresholdPx = PixelUtil.toPixelFromDIP(120f)

  /** Authoritative content height (px), pushed from JS. Decoupled from the spacer child's layout,
   *  which reads stale right after a transaction and oscillates during windowing churn. */
  private var contentHeightPx = 0

  // Fabric state bridge: the live scroll offset is pushed into the shadow node's State so
  // getContentOriginOffset can shift descendant window coords (measureInWindow + findNodeAtPoint).
  // Wired in by the ViewManager's updateState.
  var stateWrapper: StateWrapper? = null
  private var lastPushedOffsetY = Float.NaN
  // The offset is pushed to Fabric State only once scrolling settles (idle), not per frame: the only
  // readers (measureInWindow / findNodeAtPoint) fire when the finger is held still, so per-frame
  // commits during a fling would be wasted work. Debounced via this runnable.
  private val statePushRunnable = Runnable { pushScrollState() }

  // MVCP anchor: topmost visible cell + its content-top, so a prepend / above-fold height change can
  // be compensated (shift scrollY by the same delta) to keep the visible content from jumping.
  private var anchorChild: View? = null
  private var anchorTop = 0

  // Fires after every layout pass — the only point where a shifted cell's new top is readable (Fabric
  // doesn't route child layouts through this view's onLayout). Drives the MVCP anchor adjust.
  private val globalLayoutListener = ViewTreeObserver.OnGlobalLayoutListener {
    // A prepend / above-fold change moves the anchor → hold the visible position. Stick to the bottom
    // only when the anchor did NOT move (content appended below the fold) and we're near the bottom.
    if (!applyAnchorAdjust() && stickToBottom) maintainBottomIfStuck()
    // Re-pick the anchor — but only when scrolled up. Window churn (a measurement re-window between a
    // scroll and a prepend) can recycle the cached anchor; pickAnchor otherwise ran only during scrolling,
    // so a recycled anchor stayed null forever and later prepends had nothing to compensate against
    // (#4-part-2). Gated on !stickToBottom because at the bottom the anchor must stay null so the stick
    // owns the position — an active anchor there holds against measurement settles and drifts off-bottom.
    if (!stickToBottom) pickAnchor()
  }

  init {
    clipChildren = true
    isVerticalScrollBarEnabled = true
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    viewTreeObserver.addOnGlobalLayoutListener(globalLayoutListener)
  }

  override fun onDetachedFromWindow() {
    removeCallbacks(statePushRunnable)
    viewTreeObserver.removeOnGlobalLayoutListener(globalLayoutListener)
    super.onDetachedFromWindow()
  }

  // --- content height + bottom anchoring (stick-to-bottom: newest content stays visible) ---

  fun setContentHeightDip(dp: Double) {
    val px = max(0, PixelUtil.toPixelFromDIP(dp.toFloat()).toInt())
    if (px == contentHeightPx) return
    Log.d("NML5", "setContentH px=$px was=$contentHeightPx scrollY=$scrollY h=$height maxYnew=${max(0, px - height)} stick=$stickToBottom")
    contentHeightPx = px
    // Stick / anchor adjust runs post-layout in the listener, which can tell a prepend (anchor moved →
    // hold) from an append (anchor didn't → stick). Sticking here (pre-layout) snapped on prepends too.
    //
    // EXCEPTION — the initial open (#5): estimate→real heights balloon the total here, but the listener
    // doesn't re-pin reliably at that first settle, so the list stays parked at the estimate-based
    // bottom with dead space above. Re-pin to the true bottom directly — gated on !hasUserScrolled so
    // this is the open-settle only and can never fire for a prepend (which needs a scroll-up first).
    if (stickToBottom && !hasUserScrolled) maintainBottomIfStuck()
  }

  private fun maxScrollY(): Int = max(0, contentHeightPx - height)

  /** Pin to the bottom while stuck. Driven by content-height pushes from JS and by size changes, so
   *  the newest content stays visible as the list grows or the viewport shrinks (e.g. keyboard). */
  internal fun maintainBottomIfStuck() {
    Log.d("NML5", "maintain stick=$stickToBottom target=${maxScrollY()} scrollY=$scrollY h=$height contentHpx=$contentHeightPx")
    if (!stickToBottom) return
    val target = maxScrollY()
    if (scrollY != target) scrollTo(0, target)
  }

  /** Imperative scroll to a content offset (dp), clamped to the scroll range. Animated reuses the
   *  OverScroller so it shares computeScroll's incremental path. Backs the JS ref's scrollToOffset /
   *  scrollToEnd / scrollToIndex — JS owns the height model and converts index/end into an offset. */
  fun scrollToOffsetDip(dp: Double, animated: Boolean) {
    val target = PixelUtil.toPixelFromDIP(dp.toFloat()).toInt().coerceIn(0, maxScrollY())
    if (animated) {
      if (!scroller.isFinished) scroller.abortAnimation()
      lastFlingY = scrollY
      scroller.startScroll(0, scrollY, 0, target - scrollY)
      postInvalidateOnAnimation()
    } else {
      scrollTo(0, target)
    }
  }

  /** Re-evaluate stick mode: stuck when at (or within a threshold of) the bottom. Scrolling up
   *  releases it; scrolling back to the bottom re-engages it. */
  private fun refreshStickToBottom() {
    val maxY = maxScrollY()
    stickToBottom = maxY <= 0 || scrollY >= maxY - stickThresholdPx
    Log.d("NML5", "refreshStick scrollY=$scrollY maxY=$maxY -> stick=$stickToBottom")
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    Log.d("NML5", "sizeChanged h=$h oldh=$oldh contentHpx=$contentHeightPx scrollY=$scrollY stick=$stickToBottom")
    if (oldh > 0 && h != oldh && !stickToBottom) {
      // Resize while scrolled up (keyboard / attachment picker): the viewport changed but scrollY
      // didn't follow, so the content slid out from under the user. Shift scrollY by the height delta
      // so the bottom of the visible content stays anchored — the scroll moves WITH the resize (#4).
      // At the bottom we're stuck, so maintainBottomIfStuck handles it (the only case that worked before).
      scrollTo(0, (scrollY + (oldh - h)).coerceIn(0, maxScrollY()))
    } else {
      maintainBottomIfStuck()
    }
  }

  /** Record the topmost visible cell as the MVCP anchor (skipping the full-height spacer). Called as
   *  the user scrolls, so a later prepend / above-fold height change can be compensated against it. */
  private fun pickAnchor() {
    var best: View? = null
    var bestTop = Int.MAX_VALUE
    for (i in 0 until childCount) {
      val c = getChildAt(i)
      if (c.height >= height) continue // the spacer is taller than the viewport
      if (c.bottom > scrollY && c.top < bestTop) {
        best = c
        bestTop = c.top
      }
    }
    anchorChild = best
    anchorTop = best?.top ?: 0
  }

  /** If the anchor cell moved (offsets shifted from a prepend or an above-fold height settle), shift
   *  scrollY by the same delta so the visible content stays put — our maintainVisibleContentPosition. */
  /** Returns true if it adjusted the scroll — i.e. the anchor moved, meaning content shifted above the
   *  fold (a prepend / above-fold height change). False means nothing moved above the fold. */
  private fun applyAnchorAdjust(): Boolean {
    val a = anchorChild ?: return false
    if (a.parent !== this) {
      anchorChild = null
      return false
    }
    val delta = a.top - anchorTop
    if (delta != 0) {
      scrollTo(0, (scrollY + delta).coerceIn(0, maxScrollY()))
      anchorTop = a.top
      return true
    }
    return false
  }

  // --- scroll engine ---

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    when (ev.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        lastTouchY = ev.y
        isDragging = false
        Log.d("NML1", "DOWN y=${ev.y.toInt()} slop=$touchSlop")
        if (!scroller.isFinished) scroller.abortAnimation()
      }
      MotionEvent.ACTION_MOVE -> {
        val dy = abs(ev.y - lastTouchY)
        if (!isDragging && dy > touchSlop) {
          isDragging = true
          hasUserScrolled = true
          lastTouchY = ev.y
          Log.d("NML1", "CLAIMED drag dy=${dy.toInt()} slop=$touchSlop (steals child gesture)")
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
        hasUserScrolled = true
        val dy = (lastTouchY - ev.y).toInt()
        lastTouchY = ev.y
        scrollTo(0, (scrollY + dy).coerceIn(0, maxScrollY()))
        pickAnchor()
      }
      MotionEvent.ACTION_UP -> {
        tracker.computeCurrentVelocity(1000, maxFlingVelocity.toFloat())
        val velocityY = -tracker.yVelocity.toInt()
        if (abs(velocityY) > minFlingVelocity) {
          // maxY unbounded: let the fling decelerate by physics and clamp each frame in
          // computeScroll() to the live maxScrollY() (binding it directly truncated fast downward
          // flings mid-curve). Upward stays exact via minY = 0.
          scroller.fling(0, scrollY, 0, velocityY, 0, 0, 0, Int.MAX_VALUE)
          lastFlingY = scrollY
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
      // Apply the fling's per-frame DELTA to the live scrollY, not the absolute scroller.currY. A prepend's
      // anchor/stick compensation runs between fling frames; writing the absolute position would overwrite
      // it every frame, so the position drifts (and the window freezes) while content is inserted mid-fling.
      val flingDelta = scroller.currY - lastFlingY
      lastFlingY = scroller.currY
      scrollTo(0, (scrollY + flingDelta).coerceIn(0, maxScrollY()))
      pickAnchor()
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
    scheduleStatePush()
  }

  private fun recycleVelocityTracker() {
    velocityTracker?.recycle()
    velocityTracker = null
  }

  // --- events to JS ---

  /** Debounce the State push to scroll-idle: each scroll change resets the timer; ~100ms after the
   *  last change the scroll has settled and we push once. Long-press (the measure trigger) needs a
   *  ~500ms still hold, so the offset is always current by the time anything reads it. */
  private fun scheduleStatePush() {
    removeCallbacks(statePushRunnable)
    postDelayed(statePushRunnable, 100L)
  }

  /** Push the live scroll offset (dip) into the shadow node's State. getContentOriginOffset reads it
   *  back as -contentOffset, so Fabric coordinate math (measureInWindow + findNodeAtPoint) accounts
   *  for our custom scroll. Deduped to skip sub-pixel repeats. */
  private fun pushScrollState() {
    val wrapper = stateWrapper ?: return
    val dipY = PixelUtil.toDIPFromPixel(scrollY.toFloat())
    if (!lastPushedOffsetY.isNaN() && abs(lastPushedOffsetY - dipY) < 0.5f) return
    lastPushedOffsetY = dipY
    val map = WritableNativeMap()
    map.putDouble("contentOffsetX", 0.0)
    map.putDouble("contentOffsetY", dipY.toDouble())
    wrapper.updateState(map)
  }

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
