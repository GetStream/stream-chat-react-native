/**
 * The only translation data bundled with the SDK. Hand-maintained.
 *
 * Prose keys are not here — they pass their English copy inline at the call site
 * (`t('message.status.sent.text', 'Sent')`). These keys have no inline copy to fall back on:
 * they are formatter expressions, passed around as prop values and resolved by name at runtime
 * (`timestampTranslationKey`), so the extractor never sees a literal call site for them.
 *
 * The leaf segment is the consuming component's name and stays PascalCase, matching the web SDK
 * and the `timestamp/<Component>` values these keys replace. Every other namespace is lower
 * camelCase.
 *
 * Unlike the web SDK this catalog has no `language.*` namespace (React Native never rendered ISO
 * language names) and no `translationBuilderTopic.*` — there is no i18next postProcessor here; the
 * formatter registry in `utils/i18n/predefinedFormatters.ts` is the whole extension surface.
 *
 * `yarn build-translations` joins this file with the inline defaults to generate
 * `src/i18n/keys.ts`; `yarn i18n:export` writes the joined catalog as JSON.
 *
 * Two entries carry English day words inside their `calendarFormats` argument —
 * `timestamp.ChannelPreviewStatus` and `timestamp.ThreadListItem`. Integrators translate those by
 * overriding the key; `dayjsLocaleConfigForLanguage` does not reach them, because `getDateString`
 * short-circuits to `t()` before the Day.js calendar path and `timestampFormatter` then parses the
 * calendar config out of the translation value itself. Adding a third fails a guard in
 * `__tests__/Streami18n.test.ts` that keeps `ai-docs/i18n-v15-migration.md` in sync.
 */
export const runtimeDefaults = {
  'duration.messageReminder': '{{ milliseconds | durationFormatter(withSuffix: true) }}',
  'timestamp.ChannelPreviewStatus':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: {"lastDay":"[Yesterday]", "lastWeek":"dddd", "nextDay":"[Tomorrow]", "nextWeek":"dddd [at] LT", "sameDay":"LT", "sameElse":"L"}) }}',
  'timestamp.FileAttachmentListSection': '{{ timestamp | timestampFormatter(format: MMMM YYYY) }}',
  'timestamp.ImageGalleryHeader': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.InlineDateSeparator': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.MessageSystem': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.MessageTimestamp': '{{ timestamp | timestampFormatter(format: LT) }}',
  'timestamp.PollVote': '{{ timestamp | relativeCompactDateFormatter }}',
  'timestamp.StickyHeader': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.ThreadListItem':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: {"lastDay":"[Yesterday]", "lastWeek":"dddd", "nextDay":"[Tomorrow]", "nextWeek":"dddd [at] LT", "sameDay":"LT", "sameElse":"L"}) }}',
  'timestamp.UserActivityStatus': 'Last seen {{ timestamp | fromNowFormatter }}',
};
