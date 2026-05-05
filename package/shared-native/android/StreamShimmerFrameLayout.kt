package com.streamchatreactnative

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.Shader
import android.util.AttributeSet
import android.view.Choreographer
import android.view.View
import android.widget.FrameLayout
import kotlin.math.roundToInt

/**
 * Native shimmer container used by `StreamShimmerView`.
 *
 * This view draws a base color plus a moving highlight strip directly on canvas and still behaves
 * like a regular container for React children. The animation runs fully on the native side so it
 * does not depend on JS-driven frame updates. It automatically stops animating when the view is
 * detached or not visible, rebuilds its shader when size or colors change, and waits for valid
 * dimensions before starting animation to avoid invalid draw/animation states.
 */
class StreamShimmerFrameLayout @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
) : FrameLayout(context, attrs) {
  private var baseColor: Int = DEFAULT_BASE_COLOR
  private var durationMs: Long = DEFAULT_DURATION_MS
  private var gradientColor: Int = DEFAULT_GRADIENT_COLOR
  private var enabled: Boolean = true

  private val basePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
  private val shimmerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.FILL
    isDither = true
  }
  private val shimmerMatrix = Matrix()
  private val visibleViewportRect = Rect()

  private var shimmerShader: LinearGradient? = null
  private var shimmerTranslateX: Float = 0f
  private var isRegisteredForShimmerFrames: Boolean = false
  private var shimmerStartTimeNanos: Long = UNSET_FRAME_TIME_NANOS

  init {
    setWillNotDraw(false)
  }

  fun setBaseColor(color: Int) {
    if (baseColor == color) return
    baseColor = color
    rebuildShimmerShader()
    invalidate()
  }

  fun setGradientColor(color: Int) {
    if (gradientColor == color) return
    gradientColor = color
    rebuildShimmerShader()
    invalidate()
  }

  fun setDuration(duration: Int) {
    val normalizedDurationMs =
      if (duration > 0) duration.toLong() else DEFAULT_DURATION_MS
    if (durationMs == normalizedDurationMs) return
    durationMs = normalizedDurationMs
    shimmerStartTimeNanos = UNSET_FRAME_TIME_NANOS
    updateAnimatorState()
  }

  fun setShimmerEnabled(enabled: Boolean) {
    if (this.enabled == enabled) return
    this.enabled = enabled
    updateAnimatorState()
    invalidate()
  }

  fun updateAnimatorState() {
    // Centralized lifecycle gate for the shared frame clock. This keeps shimmer off for detached or
    // hidden views and prevents every mounted shimmer from owning a separate ValueAnimator.
    if (shouldAnimateShimmer()) {
      startShimmer()
    } else {
      stopShimmer()
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    // Reattachment (including reparenting) should recheck visibility state and restart only if
    // this instance is eligible to animate.
    updateAnimatorState()
  }

  override fun onDetachedFromWindow() {
    // Detached views are not drawable; unregister so a future attach starts cleanly.
    stopShimmer()
    super.onDetachedFromWindow()
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    rebuildShimmerShader()
    updateAnimatorState()
  }

  override fun onWindowVisibilityChanged(visibility: Int) {
    super.onWindowVisibilityChanged(visibility)
    updateAnimatorState()
  }

  override fun onVisibilityChanged(changedView: View, visibility: Int) {
    super.onVisibilityChanged(changedView, visibility)
    updateAnimatorState()
  }

  override fun dispatchDraw(canvas: Canvas) {
    val viewWidth = width.toFloat()
    val viewHeight = height.toFloat()
    if (viewWidth <= 0f || viewHeight <= 0f) {
      super.dispatchDraw(canvas)
      return
    }

    basePaint.color = baseColor
    canvas.drawRect(0f, 0f, viewWidth, viewHeight, basePaint)

    drawShimmer(canvas, viewWidth, viewHeight)
    super.dispatchDraw(canvas)
  }

  private fun drawShimmer(canvas: Canvas, viewWidth: Float, viewHeight: Float) {
    if (!enabled) return

    val shader = shimmerShader ?: return

    shimmerMatrix.setTranslate(shimmerTranslateX, 0f)
    shader.setLocalMatrix(shimmerMatrix)
    shimmerPaint.shader = shader
    canvas.drawRect(0f, 0f, viewWidth, viewHeight, shimmerPaint)
    shimmerPaint.shader = null
  }

  private fun rebuildShimmerShader() {
    // Recreates the shimmer gradient for the current width/colors. This allocates shader state,
    // so keep calls tied to real changes (size or color updates), not per frame execution.
    val viewWidth = width.toFloat()
    if (viewWidth <= 0f) {
      shimmerShader = null
      return
    }

    // Match iOS CAGradientLayer shimmer stops so both platforms have the same visual falloff.
    val shimmerWidth = (viewWidth * SHIMMER_STRIP_WIDTH_RATIO).coerceAtLeast(1f)
    val transparentHighlight = colorWithAlpha(gradientColor, 0f)
    val softBase = colorWithAlpha(gradientColor, SOFT_HIGHLIGHT_ALPHA_FACTOR)
    shimmerShader = LinearGradient(
      0f,
      0f,
      shimmerWidth,
      0f,
      intArrayOf(
        transparentHighlight,
        softBase,
        gradientColor,
        softBase,
        transparentHighlight,
      ),
      floatArrayOf(
        0f,
        0.35f,
        0.5f,
        0.65f,
        1f,
      ),
      Shader.TileMode.CLAMP,
    )
  }

  private fun startShimmer() {
    if (isRegisteredForShimmerFrames) return
    val viewWidth = width.toFloat()
    shimmerStartTimeNanos = UNSET_FRAME_TIME_NANOS
    if (viewWidth > 0f) {
      shimmerTranslateX = -(viewWidth * SHIMMER_STRIP_WIDTH_RATIO).coerceAtLeast(1f)
    }
    isRegisteredForShimmerFrames = true
    StreamShimmerFrameClock.register(this)
  }

  private fun stopShimmer() {
    if (isRegisteredForShimmerFrames) {
      isRegisteredForShimmerFrames = false
      StreamShimmerFrameClock.unregister(this)
    }
    resetShimmerFrameState()
  }

  internal fun onSharedShimmerFrame(frameTimeNanos: Long) {
    val viewWidth = width.toFloat()
    if (viewWidth <= 0f || !hasVisibleViewport()) return

    if (shimmerStartTimeNanos == UNSET_FRAME_TIME_NANOS) {
      shimmerStartTimeNanos = frameTimeNanos
    }

    // Animate from fully offscreen left to fully offscreen right so the strip enters/exits cleanly.
    val shimmerWidth = (viewWidth * SHIMMER_STRIP_WIDTH_RATIO).coerceAtLeast(1f)
    val durationNanos = (durationMs * NANOS_PER_MILLISECOND).coerceAtLeast(1L)
    val elapsedNanos = (frameTimeNanos - shimmerStartTimeNanos).coerceAtLeast(0L)
    val progress = (elapsedNanos % durationNanos).toFloat() / durationNanos.toFloat()

    shimmerTranslateX = -shimmerWidth + ((viewWidth + shimmerWidth) * progress)
    invalidate()
  }

  internal fun onRemovedFromSharedFrameClock() {
    isRegisteredForShimmerFrames = false
    resetShimmerFrameState()
  }

  internal fun shouldRunSharedShimmerFrame(): Boolean {
    return shouldAnimateShimmer()
  }

  private fun hasVisibleViewport(): Boolean {
    visibleViewportRect.setEmpty()
    return getGlobalVisibleRect(visibleViewportRect) && !visibleViewportRect.isEmpty
  }

  private fun resetShimmerFrameState() {
    shimmerStartTimeNanos = UNSET_FRAME_TIME_NANOS
    shimmerTranslateX = 0f
  }

  private fun shouldAnimateShimmer(): Boolean {
    // `isShown` and explicit visibility/window checks cover different hide paths in nested
    // hierarchies. Keeping them all prevents animations running when not visible to the user.
    return enabled &&
      isAttachedToWindow &&
      width > 0 &&
      height > 0 &&
      visibility == View.VISIBLE &&
      windowVisibility == View.VISIBLE &&
      isShown &&
      alpha > 0f
  }

  private fun colorWithAlpha(color: Int, alphaFactor: Float): Int {
    // Preserve RGB while shaping only alpha; used for symmetric highlight falloff in gradient stops.
    val alpha = (Color.alpha(color) * alphaFactor).roundToInt().coerceIn(0, 255)
    return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color))
  }

  companion object {
    private const val DEFAULT_BASE_COLOR = 0x00FFFFFF
    private const val DEFAULT_DURATION_MS = 1200L
    private const val DEFAULT_GRADIENT_COLOR = 0x59FFFFFF
    private const val NANOS_PER_MILLISECOND = 1_000_000L
    private const val SHIMMER_STRIP_WIDTH_RATIO = 1.25f
    private const val SOFT_HIGHLIGHT_ALPHA_FACTOR = 0.24f
    private const val UNSET_FRAME_TIME_NANOS = -1L
  }
}

private object StreamShimmerFrameClock : Choreographer.FrameCallback {
  private val activeViews = LinkedHashSet<StreamShimmerFrameLayout>()
  private var frameScheduled = false

  fun register(view: StreamShimmerFrameLayout) {
    activeViews.add(view)
    scheduleNextFrame()
  }

  fun unregister(view: StreamShimmerFrameLayout) {
    activeViews.remove(view)
    if (activeViews.isEmpty() && frameScheduled) {
      Choreographer.getInstance().removeFrameCallback(this)
      frameScheduled = false
    }
  }

  override fun doFrame(frameTimeNanos: Long) {
    frameScheduled = false
    if (activeViews.isEmpty()) return

    val iterator = activeViews.iterator()
    while (iterator.hasNext()) {
      val view = iterator.next()
      if (view.shouldRunSharedShimmerFrame()) {
        view.onSharedShimmerFrame(frameTimeNanos)
      } else {
        iterator.remove()
        view.onRemovedFromSharedFrameClock()
      }
    }

    scheduleNextFrame()
  }

  private fun scheduleNextFrame() {
    if (frameScheduled || activeViews.isEmpty()) return
    Choreographer.getInstance().postFrameCallback(this)
    frameScheduled = true
  }
}
