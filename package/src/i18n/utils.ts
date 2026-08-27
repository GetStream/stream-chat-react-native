import {
  createDefaultTranslatorFunction,
  getCalendarDateStringForA11y as coreGetCalendarDateStringForA11y,
  getDateString as coreGetDateString,
  getDateStringForA11y as coreGetDateStringForA11y,
} from 'stream-chat/i18n';

import type { StreamTFunction } from './types';

/**
 * The `t` in force before i18next has initialized, and the default value of the translation context.
 *
 * Core's factory, instantiated against this SDK's catalog so it is typed the same as the real `t`. It
 * honours the inline `defaultValue` at each call site, which is what stops raw dotted keys flashing on
 * the first frame — or rendering permanently for a component used outside `<OverlayProvider>`.
 */
export const defaultTranslatorFunction: StreamTFunction =
  createDefaultTranslatorFunction() as StreamTFunction;

/**
 * The date/time and key helpers now live in `stream-chat/i18n`, shared with the React SDK.
 *
 * Re-exported from here rather than rewritten at ~15 call sites, so the internal module path stays
 * stable. `getDateString` and the type guards behave identically; `predefinedFormatters` gains
 * `fromNowFormatter` and loses `relativeCompactDateFormatter` — that behaviour is
 * `timestampFormatter` with `relativeCompact: true`, whose wording goes through `t()` rather than being
 * hardcoded English as it was here.
 */
export {
  asDynamicKey,
  defaultDateTimeParser,
  isDate,
  isDayOrMoment,
  isNumberOrString,
  predefinedFormatters,
} from 'stream-chat/i18n';

/**
 * The largest value `new Date(ms)` accepts before it clips to an invalid instance.
 * ECMA-262 `TimeClip`, 8.64e15 ms — about ±273,790 years.
 */
const MAX_TIME_VALUE = 8.64e15;

/**
 * Rescales a timestamp that arrived in nanoseconds.
 *
 * The API expresses timestamps as nanoseconds since the epoch and `stream-chat` converts them on the
 * way in — but only for the fields its response decoders name. `latest_votes_by_option` is not one of
 * them (unlike `latest_answers` and `own_votes` beside it), so a poll vote's `created_at` reaches the
 * UI as a raw integer around 1e18. That is past `MAX_TIME_VALUE`, so Day.js builds an invalid instance
 * and `format()` renders the literal string `"Invalid Date"` next to the voter's name.
 *
 * Only out-of-range numbers are touched, so a millisecond timestamp an integrator passes through the
 * public `getDateString` keeps working. The `1e6` divisor is the conversion core's own `DatetimeType`
 * decoder applies, so a rescaled value lands on the same instant core would have produced.
 */
const normalizeTimestamp = <T>(value: T): T | Date | undefined => {
  if (typeof value !== 'number' || Math.abs(value) <= MAX_TIME_VALUE) return value;

  const milliseconds = Math.floor(value / 1e6);
  return Math.abs(milliseconds) <= MAX_TIME_VALUE ? new Date(milliseconds) : undefined;
};

/**
 * `null` means "nothing renderable", which every caller already handles by omitting the element.
 * `"Invalid Date"` is what Day.js formats an unparseable instance into, and it reaches the screen as
 * copy. Whatever shape produced it, showing nothing is the better failure.
 */
const withoutInvalidDate = <T>(result: T) =>
  typeof result === 'string' && result.includes('Invalid Date') ? null : result;

/**
 * This SDK's date formatters: core's, with the timestamp normalized on the way in and an invalid
 * result suppressed on the way out. Wrapped rather than fixed at the ~14 call sites, because the
 * shape a timestamp arrives in is not something a call site can see.
 */
export const getDateString: typeof coreGetDateString = ({ messageCreatedAt, ...rest }) =>
  withoutInvalidDate(
    coreGetDateString({ ...rest, messageCreatedAt: normalizeTimestamp(messageCreatedAt) }),
  );

export const getDateStringForA11y: typeof coreGetDateStringForA11y = ({
  messageCreatedAt,
  ...rest
}) =>
  withoutInvalidDate(
    coreGetDateStringForA11y({ ...rest, messageCreatedAt: normalizeTimestamp(messageCreatedAt) }),
  );

export const getCalendarDateStringForA11y: typeof coreGetCalendarDateStringForA11y = ({
  messageCreatedAt,
  ...rest
}) => {
  const result = coreGetCalendarDateStringForA11y({
    ...rest,
    messageCreatedAt: normalizeTimestamp(messageCreatedAt),
  });
  return withoutInvalidDate(result) ?? undefined;
};
