package com.streamchatreactnative.shared

import android.app.Activity
import android.text.format.DateFormat
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.google.android.material.datepicker.CalendarConstraints
import com.google.android.material.datepicker.CompositeDateValidator
import com.google.android.material.datepicker.DateValidatorPointBackward
import com.google.android.material.datepicker.DateValidatorPointForward
import com.google.android.material.datepicker.MaterialDatePicker
import com.google.android.material.timepicker.MaterialTimePicker
import com.google.android.material.timepicker.TimeFormat
import java.lang.ref.WeakReference
import java.util.Calendar
import java.util.TimeZone

/**
 * Presents the Material date or time picker and reports the selected moment in milliseconds, or
 * null when the picker is cancelled or cannot be shown. Each package passes its own theme ids.
 */
object StreamDateTimePicker {
  private const val TAG = "StreamDateTimePicker"
  private val utc: TimeZone = TimeZone.getTimeZone("UTC")

  // The picker whose result is still pending. It is cleared when the picker settles, so a picker
  // requested right afterwards, such as the time after the date, can open during the exit animation.
  private var active: WeakReference<DialogFragment>? = null

  data class Themes(val date: Int, val time: Int)

  fun pick(
    activity: Activity?,
    themes: Themes,
    mode: String,
    value: Long,
    minimumDate: Long?,
    maximumDate: Long?,
    onResult: (Long?) -> Unit,
  ) {
    val host = activity as? FragmentActivity
    if (host == null || host.isFinishing || host.isDestroyed) {
      onResult(null)
      return
    }

    host.runOnUiThread {
      val fragments = host.supportFragmentManager
      // Only one picker is shown at a time, and none while the fragment manager has saved its state.
      if (fragments.isStateSaved || active?.get() != null) {
        onResult(null)
        return@runOnUiThread
      }

      var settled = false
      var lifecycleObserver: LifecycleEventObserver? = null
      val settle = { result: Long? ->
        if (!settled) {
          settled = true
          active = null
          lifecycleObserver?.let { host.lifecycle.removeObserver(it) }
          onResult(result)
        }
      }
      // The dialog is destroyed together with its activity, in which case the call resolves as cancelled.
      lifecycleObserver = LifecycleEventObserver { _, event ->
        if (event == Lifecycle.Event.ON_DESTROY) settle(null)
      }
      host.lifecycle.addObserver(lifecycleObserver)

      if (mode == "time") {
        val current = localCalendar(value)
        val picker =
          MaterialTimePicker.Builder()
            .setTheme(themes.time)
            .setTimeFormat(
              if (DateFormat.is24HourFormat(host)) TimeFormat.CLOCK_24H else TimeFormat.CLOCK_12H,
            )
            .setInputMode(MaterialTimePicker.INPUT_MODE_KEYBOARD)
            .setHour(current.get(Calendar.HOUR_OF_DAY))
            .setMinute(current.get(Calendar.MINUTE))
            .build()
        picker.addOnPositiveButtonClickListener {
          current.set(Calendar.HOUR_OF_DAY, picker.hour)
          current.set(Calendar.MINUTE, picker.minute)
          current.set(Calendar.SECOND, 0)
          current.set(Calendar.MILLISECOND, 0)
          settle(current.timeInMillis)
        }
        picker.addOnDismissListener { settle(null) }
        active = WeakReference(picker)
        picker.show(fragments, TAG)
        return@runOnUiThread
      }

      // MaterialDatePicker selections are UTC midnights, so only the calendar day is read from the
      // selection and the time of day is preserved from `value`.
      val validators = mutableListOf<CalendarConstraints.DateValidator>()
      minimumDate?.let { validators.add(DateValidatorPointForward.from(utcMidnight(it))) }
      maximumDate?.let { validators.add(DateValidatorPointBackward.before(utcMidnight(it))) }
      val constraints = CalendarConstraints.Builder().setOpenAt(utcMidnight(value))
      if (validators.isNotEmpty()) {
        constraints.setValidator(CompositeDateValidator.allOf(validators))
      }

      val picker =
        MaterialDatePicker.Builder.datePicker()
          .setTheme(themes.date)
          .setSelection(utcMidnight(value))
          .setCalendarConstraints(constraints.build())
          .build()
      picker.addOnPositiveButtonClickListener { selection ->
        val picked = Calendar.getInstance(utc).apply { timeInMillis = selection }
        val result = localCalendar(value)
        result.set(
          picked.get(Calendar.YEAR),
          picked.get(Calendar.MONTH),
          picked.get(Calendar.DAY_OF_MONTH),
        )
        settle(result.timeInMillis)
      }
      picker.addOnDismissListener { settle(null) }
      active = WeakReference(picker)
      picker.show(fragments, TAG)
    }
  }

  /** Dismisses the picker currently shown, which resolves its call as cancelled. */
  fun dismissActive() {
    val picker = active?.get() ?: return
    picker.activity?.runOnUiThread { picker.dismissAllowingStateLoss() }
  }

  /**
   * Dismisses pickers the fragment manager restored after the activity was recreated, for example
   * on rotation. Their calls have already resolved as cancelled and nothing observes them.
   */
  fun dismissOrphans(activity: Activity?) {
    val host = activity as? FragmentActivity ?: return
    host.runOnUiThread {
      val fragments = host.supportFragmentManager
      if (fragments.isStateSaved) return@runOnUiThread
      fragments.fragments
        .filter { it.tag == TAG && it !== active?.get() }
        .forEach { (it as? DialogFragment)?.dismissAllowingStateLoss() }
    }
  }

  private fun localCalendar(millis: Long): Calendar =
    Calendar.getInstance().apply { timeInMillis = millis }

  /** Returns the UTC midnight of the local calendar day containing `millis`. */
  private fun utcMidnight(millis: Long): Long {
    val local = localCalendar(millis)
    return Calendar.getInstance(utc)
      .apply {
        clear()
        set(local.get(Calendar.YEAR), local.get(Calendar.MONTH), local.get(Calendar.DAY_OF_MONTH))
      }
      .timeInMillis
  }
}
