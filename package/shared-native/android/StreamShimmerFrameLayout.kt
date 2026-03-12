package com.streamchatreactnative

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Shader
import android.util.AttributeSet
import android.view.View
import android.view.animation.LinearInterpolator
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

  private var shimmerShader: LinearGradient? = null
  private var shimmerTranslateX: Float = 0f
  private var animatedDurationMs: Long = 0L
  private var animatedViewWidth: Float = 0f
  private var animator: ValueAnimator? = null

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
    updateAnimatorState()
  }

  fun setShimmerEnabled(enabled: Boolean) {
    if (this.enabled == enabled) return
    this.enabled = enabled
    updateAnimatorState()
    invalidate()
  }

  fun updateAnimatorState() {
    // Centralized lifecycle gate for animation start/stop. This keeps shimmer off for detached or
    // hidden views to avoid wasting UI-thread work in long lists.
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
    // Detached views are not drawable; stop and clear animator so a future attach starts cleanly.
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
    if (changedView === this) {
      updateAnimatorState()
    }
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

    // Wide multi-stop strip creates a softer "glassy" sweep and avoids the hard thin-line look.
    val shimmerWidth = (viewWidth * SHIMMER_STRIP_WIDTH_RATIO).coerceAtLeast(1f)
    val transparentHighlight = colorWithAlpha(gradientColor, 0f)
    val edgeBase = colorWithAlpha(gradientColor, EDGE_HIGHLIGHT_ALPHA_FACTOR)
    val softBase = colorWithAlpha(gradientColor, SOFT_HIGHLIGHT_ALPHA_FACTOR)
    val mediumBase = colorWithAlpha(gradientColor, MID_HIGHLIGHT_ALPHA_FACTOR)
    val innerBase = colorWithAlpha(gradientColor, INNER_HIGHLIGHT_ALPHA_FACTOR)
    shimmerShader = LinearGradient(
      0f,
      0f,
      shimmerWidth,
      0f,
      intArrayOf(
        transparentHighlight,
        edgeBase,
        softBase,
        mediumBase,
        innerBase,
        gradientColor,
        innerBase,
        mediumBase,
        softBase,
        edgeBase,
        transparentHighlight,
      ),
      floatArrayOf(
        0f,
        0.08f,
        0.2f,
        0.32f,
        0.4f,
        0.5f,
        0.6f,
        0.68f,
        0.8f,
        0.92f,
        1f,
      ),
      Shader.TileMode.CLAMP,
    )
  }

  private fun startShimmer() {
    val viewWidth = width.toFloat()
    if (viewWidth <= 0f) return
    // Keep the existing animator only when size and duration still match the current request.
    if (animator != null && animatedViewWidth == viewWidth && animatedDurationMs == durationMs) return

    stopShimmer()

    // Animate from fully offscreen left to fully offscreen right so the strip enters/exits cleanly.
    val shimmerWidth = (viewWidth * SHIMMER_STRIP_WIDTH_RATIO).coerceAtLeast(1f)
    animatedViewWidth = viewWidth
    animatedDurationMs = durationMs
    animator = ValueAnimator.ofFloat(-shimmerWidth, viewWidth).apply {
      duration = durationMs
      repeatCount = ValueAnimator.INFINITE
      interpolator = LinearInterpolator()
      addUpdateListener {
        shimmerTranslateX = it.animatedValue as Float
        invalidate()
      }
      start()
    }
  }

  private fun stopShimmer() {
    animator?.cancel()
    animator = null
    animatedDurationMs = 0L
    animatedViewWidth = 0f
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
    private const val SHIMMER_STRIP_WIDTH_RATIO = 1.25f
    private const val EDGE_HIGHLIGHT_ALPHA_FACTOR = 0.1f
    private const val SOFT_HIGHLIGHT_ALPHA_FACTOR = 0.24f
    private const val MID_HIGHLIGHT_ALPHA_FACTOR = 0.48f
    private const val INNER_HIGHLIGHT_ALPHA_FACTOR = 0.72f
  }
}
