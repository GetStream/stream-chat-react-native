package com.streamio.aicomponents.renderkit

import PerfTextView
import android.content.Context
import android.view.View
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import kotlin.math.ceil

@ReactModule(name = "PerfText")
class PerfTextViewManager : SimpleViewManager<PerfTextView>() {

  override fun getName() = "PerfText"
  override fun createViewInstance(rc: ThemedReactContext) = PerfTextView(rc)

  @ReactProp(name = "text")
  fun setText(v: PerfTextView, text: String?) {
    v.setTextValue(text ?: "")
  }

  @ReactProp(name = "colorRanges")
  fun setColorRanges(v: PerfTextView, arr: ReadableArray?) {
    val out = mutableListOf<PerfTextView.ColorRange>()
    if (arr != null) {
      for (i in 0 until arr.size()) {
        val m = arr.getMap(i)
        val start = m!!.getInt("start")
        val end = m.getInt("end")
        val dyn: Dynamic = m.getDynamic("color")
        val color = when (dyn.type) {
          ReadableType.Number -> dyn.asInt()
          ReadableType.String -> ColorPropConverter.getColor(dyn.asString(), v.context)
          else -> 0xff000000.toInt()
        } ?: 0xff000000.toInt()
        out.add(PerfTextView.ColorRange(start, end, color))
      }
    }
    v.setColorRanges(out)
  }

  @ReactProp(name = "fontSize")
  fun setFontSize(v: PerfTextView, sizeSp: Double) {
    if (sizeSp > 0) v.textSize = sizeSp.toFloat()
  }

  @ReactProp(name = "lineHeight")
  fun setLineHeight(v: PerfTextView, height: Double) {
    val targetPx = PixelUtil.toPixelFromDIP(height.toFloat())
    if (height > 0) {
      v.setLineSpacing(0f, targetPx / v.textSize)
    } else {
      // default to no multiplier rather than default line height
      v.setLineSpacing(0.0f, 1.0f)
    };
  }

  @ReactProp(name = "fontFamily")
  fun setFontFamily(v: PerfTextView, family: String?) {
    v.setFontFamilyCompat(family)
  }

  // A fabric measurement hook.
  // Will only be called by FabricUIManager.measure(), via the C++ measurement manager.
  override fun measure(
    context: Context,
    localData: ReadableMap?,
    props: ReadableMap?,
    state: ReadableMap?,
    width: Float,
    widthMode: YogaMeasureMode?,
    height: Float,
    heightMode: YogaMeasureMode?,
    attachmentsPositions: FloatArray?
  ): Long {
    val view = PerfTextView(context)

    // Apply props that influence size (text, fontSize, lineHeight)
    props?.let { p ->
      if (p.hasKey("fontSize") && !p.isNull("fontSize")) {
        val fs = p.getDouble("fontSize")
        if (fs > 0.0) {
          view.textSize = fs.toFloat()
        }
      }

      if (p.hasKey("fontFamily") && !p.isNull("fontFamily")) {
        view.setFontFamilyCompat(p.getString("fontFamily"))
      }

      if (p.hasKey("lineHeight") && !p.isNull("lineHeight")) {
        val lh = p.getDouble("lineHeight")
        if (lh > 0.0) {
          val targetPx = PixelUtil.toPixelFromDIP(lh.toFloat())
          view.setLineSpacing(0.0f, targetPx / view.textSize)
        } else {
          view.setLineSpacing(0.0f, 1.0f)
        }
      }

      if (p.hasKey("text") && !p.isNull("text")) {
        view.setTextValue(p.getString("text") ?: "")
      }
      // colorRanges don’t affect size so we can ignore them for measurement
    }
    val widthPx = if (!width.isNaN()) PixelUtil.toPixelFromDIP(width) else 0f
    val heightPx = if (!height.isNaN()) PixelUtil.toPixelFromDIP(height) else 0f

    val widthSpec = when (widthMode) {
      YogaMeasureMode.EXACTLY ->
        View.MeasureSpec.makeMeasureSpec(widthPx.toInt(), View.MeasureSpec.EXACTLY)
      YogaMeasureMode.AT_MOST ->
        View.MeasureSpec.makeMeasureSpec(widthPx.toInt(), View.MeasureSpec.AT_MOST)
      else ->
        View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
    }

    val heightSpec = when (heightMode) {
      YogaMeasureMode.EXACTLY ->
        View.MeasureSpec.makeMeasureSpec(heightPx.toInt(), View.MeasureSpec.EXACTLY)
      YogaMeasureMode.AT_MOST ->
        View.MeasureSpec.makeMeasureSpec(heightPx.toInt(), View.MeasureSpec.AT_MOST)
      else ->
        View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
    }

    view.measure(widthSpec, heightSpec)

    val measuredWidthDp = ceil(PixelUtil.toDIPFromPixel(view.measuredWidth.toFloat()))
    val measuredHeightDp = ceil(PixelUtil.toDIPFromPixel(view.measuredHeight.toFloat()))

    return YogaMeasureOutput.make(measuredWidthDp * 1.5f, measuredHeightDp * 1.0f)
  }
}

