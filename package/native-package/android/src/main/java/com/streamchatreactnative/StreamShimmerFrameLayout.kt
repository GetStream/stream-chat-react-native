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
import android.view.animation.LinearInterpolator
import android.widget.FrameLayout
import kotlin.math.roundToInt

class StreamShimmerFrameLayout @JvmOverloads constructor(
  context: Context,
  attrs: AttributeSet? = null,
) : FrameLayout(context, attrs) {
  private var baseColor: Int = DEFAULT_BASE_COLOR
  private var highlightColor: Int = DEFAULT_HIGHLIGHT_COLOR
  private var gradientColor: Int = DEFAULT_GRADIENT_COLOR
  private var gradientWidth: Float = 0f
  private var gradientHeight: Float = 0f
  private var enabled: Boolean = true

  private val basePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
  private val shimmerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
  private val gradientPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
  private val shimmerMatrix = Matrix()

  private var shimmerShader: LinearGradient? = null
  private var shimmerTranslateX: Float = 0f
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
    if (gradientColor == color) return
    gradientColor = color
    invalidate()
  }

  fun setGradientWidth(widthPx: Float) {
    if (gradientWidth == widthPx) return
    gradientWidth = widthPx
    invalidate()
  }

  fun setGradientHeight(heightPx: Float) {
    if (gradientHeight == heightPx) return
    gradientHeight = heightPx
    invalidate()
  }

  fun setShimmerEnabled(enabled: Boolean) {
    if (this.enabled == enabled) return
    this.enabled = enabled
    updateAnimatorState()
    invalidate()
  }

  fun updateAnimatorState() {
    if (enabled && isAttachedToWindow && width > 0) {
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
    drawGradient(canvas, viewWidth, viewHeight)

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

  private fun drawGradient(canvas: Canvas, viewWidth: Float, viewHeight: Float) {
    if (gradientWidth <= 0f || gradientHeight <= 0f) return

    val left = (viewWidth - gradientWidth) / 2f
    val top = (viewHeight - gradientHeight) / 2f
    val right = left + gradientWidth
    val bottom = top + gradientHeight
    val gradient = LinearGradient(
      left,
      top,
      right,
      top,
      intArrayOf(
        colorWithAlpha(gradientColor, 0f),
        colorWithAlpha(gradientColor, GRADIENT_CENTER_ALPHA),
        colorWithAlpha(gradientColor, 0f),
      ),
      floatArrayOf(0f, 0.5f, 1f),
      Shader.TileMode.CLAMP,
    )
    gradientPaint.shader = gradient
    canvas.drawRect(left, top, right, bottom, gradientPaint)
    gradientPaint.shader = null
  }

  private fun rebuildShimmerShader() {
    val viewWidth = width.toFloat()
    if (viewWidth <= 0f) {
      shimmerShader = null
      return
    }

    val shimmerWidth = (viewWidth * SHIMMER_STRIP_WIDTH_RATIO).coerceAtLeast(1f)
    shimmerShader = LinearGradient(
      0f,
      0f,
      shimmerWidth,
      0f,
      intArrayOf(baseColor, highlightColor, baseColor),
      floatArrayOf(0f, 0.5f, 1f),
      Shader.TileMode.CLAMP,
    )
  }

  private fun startShimmer() {
    if (animator != null) return

    val viewWidth = width.toFloat()
    if (viewWidth <= 0f) return

    val shimmerWidth = (viewWidth * SHIMMER_STRIP_WIDTH_RATIO).coerceAtLeast(1f)
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
  }

  private fun colorWithAlpha(color: Int, alphaFactor: Float): Int {
    val alpha = (Color.alpha(color) * alphaFactor).roundToInt().coerceIn(0, 255)
    return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color))
  }

  companion object {
    private const val DEFAULT_BASE_COLOR = 0x00FFFFFF
    private const val DEFAULT_HIGHLIGHT_COLOR = 0x59FFFFFF
    private const val DEFAULT_GRADIENT_COLOR = Color.WHITE
    private const val SHIMMER_DURATION_MS = 1200L
    private const val SHIMMER_STRIP_WIDTH_RATIO = 0.35f
    private const val GRADIENT_CENTER_ALPHA = 0.35f
  }
}
