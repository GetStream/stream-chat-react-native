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
 * `null` means "nothing renderable", which every caller already handles by omitting the element.
 * `"Invalid Date"` is what Day.js formats an unparseable instance into, and it reaches the screen as
 * copy. Whatever shape produced it, showing nothing is the better failure.
 */
const withoutInvalidDate = <T>(result: T) =>
  typeof result === 'string' && result.includes('Invalid Date') ? null : result;

/**
 * This SDK's date formatters: core's, with an invalid result suppressed on the way out.
 *
 * These used to also rescale a nanosecond timestamp on the way in, because `latest_votes_by_option`
 * reached the UI as a raw integer core's decoders did not convert. That rescale is gone: every
 * server-sent timestamp is now a nanosecond number by contract, and each call site converts with
 * `convertTimestampToDate` where core data enters the tree. Guessing from the magnitude here would
 * hide a missed conversion instead of surfacing it.
 */
export const getDateString: typeof coreGetDateString = ({ messageCreatedAt, ...rest }) =>
  withoutInvalidDate(coreGetDateString({ ...rest, messageCreatedAt }));

export const getDateStringForA11y: typeof coreGetDateStringForA11y = ({
  messageCreatedAt,
  ...rest
}) => withoutInvalidDate(coreGetDateStringForA11y({ ...rest, messageCreatedAt }));

export const getCalendarDateStringForA11y: typeof coreGetCalendarDateStringForA11y = ({
  messageCreatedAt,
  ...rest
}) => {
  const result = coreGetCalendarDateStringForA11y({ ...rest, messageCreatedAt });
  return withoutInvalidDate(result) ?? undefined;
};
