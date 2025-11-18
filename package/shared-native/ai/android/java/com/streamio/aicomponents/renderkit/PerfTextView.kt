import android.content.Context
import android.text.SpannableString
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.graphics.Typeface
import androidx.appcompat.widget.AppCompatTextView
import com.facebook.react.common.assets.ReactFontManager

class PerfTextView(context: Context) : AppCompatTextView(context) {

  data class ColorRange(val start: Int, val end: Int, val color: Int)

  private var colorRanges: List<ColorRange> = emptyList()

  fun setTextValue(value: String) {
    applyTextAndColors(value, colorRanges)
  }

  fun setColorRanges(ranges: List<ColorRange>) {
    colorRanges = ranges
    applyTextAndColors(text?.toString().orEmpty(), colorRanges)
  }

  fun setFontFamilyCompat(fontFamily: String?) {
      val style = typeface?.style ?: Typeface.NORMAL
      val fontManager = ReactFontManager.getInstance()

      val tf: Typeface = fontManager.getTypeface(
        fontFamily ?: "monospace",
        style,
        context.assets,
      )

      typeface = tf
    }

  private fun applyTextAndColors(value: String, ranges: List<ColorRange>) {
    if (value.isEmpty()) {
      setText(value)
      return
    }

    val spannable = SpannableString(value)
    for (r in ranges) {
      val start = r.start.coerceAtLeast(0).coerceAtMost(value.length)
      val end = r.end.coerceAtLeast(start).coerceAtMost(value.length)
      if (start == end) continue
      spannable.setSpan(
        ForegroundColorSpan(r.color),
        start,
        end,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
      )
    }
    text = spannable
  }
}


