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

class StreamShimmerFrameLayout @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
) : FrameLayout(context, attrs) {
  private var baseColor: Int = DEFAULT_BASE_COLOR
  private var highlightColor: Int = DEFAULT_HIGHLIGHT_COLOR
  private var enabled: Boolean = true

  private val basePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
  private val shimmerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.FILL
    isDither = true
  }
  private val shimmerMatrix = Matrix()

  private var shimmerShader: LinearGradient? = null
  private var shimmerTranslateX: Float = 0f
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

  fun setHighlightColor(color: Int) {
    if (highlightColor == color) return
    highlightColor = color
    rebuildShimmerShader()
    invalidate()
  }

  fun setGradientColor(color: Int) {
    // Intentionally ignored: static center gradient rendering has been removed.
  }

  fun setGradientWidth(widthPx: Float) {
    // Intentionally ignored: static center gradient rendering has been removed.
  }

  fun setGradientHeight(heightPx: Float) {
    // Intentionally ignored: static center gradient rendering has been removed.
  }

  fun setShimmerEnabled(enabled: Boolean) {
    if (this.enabled == enabled) return
    this.enabled = enabled
    updateAnimatorState()
    invalidate()
  }

  fun updateAnimatorState() {
    if (shouldAnimateShimmer()) {
      startShimmer()
    } else {
      stopShimmer()
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    updateAnimatorState()
  }

  override fun onDetachedFromWindow() {
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
    val viewWidth = width.toFloat()
    if (viewWidth <= 0f) {
      shimmerShader = null
      return
    }

    val shimmerWidth = (viewWidth * SHIMMER_STRIP_WIDTH_RATIO).coerceAtLeast(1f)
    val transparentHighlight = colorWithAlpha(highlightColor, 0f)
    val edgeBase = colorWithAlpha(highlightColor, EDGE_HIGHLIGHT_ALPHA_FACTOR)
    val softBase = colorWithAlpha(highlightColor, SOFT_HIGHLIGHT_ALPHA_FACTOR)
    val mediumBase = colorWithAlpha(highlightColor, MID_HIGHLIGHT_ALPHA_FACTOR)
    val innerBase = colorWithAlpha(highlightColor, INNER_HIGHLIGHT_ALPHA_FACTOR)
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
        highlightColor,
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
    if (animator != null && animatedViewWidth == viewWidth) return

    stopShimmer()

    val shimmerWidth = (viewWidth * SHIMMER_STRIP_WIDTH_RATIO).coerceAtLeast(1f)
    animatedViewWidth = viewWidth
    animator = ValueAnimator.ofFloat(-shimmerWidth, viewWidth).apply {
      duration = SHIMMER_DURATION_MS
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
    animatedViewWidth = 0f
  }

  private fun shouldAnimateShimmer(): Boolean {
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
    val alpha = (Color.alpha(color) * alphaFactor).roundToInt().coerceIn(0, 255)
    return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color))
  }

  companion object {
    private const val DEFAULT_BASE_COLOR = 0x00FFFFFF
    private const val DEFAULT_HIGHLIGHT_COLOR = 0x59FFFFFF
    private const val SHIMMER_DURATION_MS = 1200L
    private const val SHIMMER_STRIP_WIDTH_RATIO = 1.25f
    private const val EDGE_HIGHLIGHT_ALPHA_FACTOR = 0.1f
    private const val SOFT_HIGHLIGHT_ALPHA_FACTOR = 0.24f
    private const val MID_HIGHLIGHT_ALPHA_FACTOR = 0.48f
    private const val INNER_HIGHLIGHT_ALPHA_FACTOR = 0.72f
  }
}
