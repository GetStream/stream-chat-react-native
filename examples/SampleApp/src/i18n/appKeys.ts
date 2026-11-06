import type { LooseTranslationDictionary } from 'stream-chat-react-native';

/**
 * Formatter expressions the SampleApp owns.
 *
 * v9 shipped these three inside the SDK's `en.json` under slash-separated names
 * (`duration/Location end at`, `duration/Remind Me`, `timestamp/ReminderNotification`). v10 bundles
 * only the formatter keys the SDK itself renders, so an app that calls its own has to supply the
 * expression — an unregistered key renders as its own raw text, not as a formatted duration.
 *
 * These are not copy: `durationFormatter` and `timestampFormatter` localise their output from the
 * active dayjs locale, so one dictionary serves every language and this is registered for all three.
 *
 * `duration.*` / `timestamp.*` is the one key shape `t()` accepts without `asDynamicKey` — the
 * signature matches formatter keys by prefix — so the call sites stay plain string literals.
 *
 * `duration/Message reminder` is deliberately absent: its expression is identical to the SDK's own
 * `duration.messageReminder`, which is still bundled, so `ReminderBanner` calls that key directly.
 */
export const appFormatterExpressions: LooseTranslationDictionary = {
  'duration.locationEndAt': '{{ milliseconds | durationFormatter(withSuffix: false) }}',
  'duration.remindMe': '{{ milliseconds | durationFormatter(withSuffix: true) }}',
  'timestamp.reminderNotification': '{{ timestamp | timestampFormatter(calendar: true) }}',
};
