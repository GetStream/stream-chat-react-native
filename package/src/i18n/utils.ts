import { createDefaultTranslatorFunction } from 'stream-chat/i18n';

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
 * `fromNowFormatter`, and `relativeCompactDateFormatter` is now an alias of
 * `timestampFormatter({ relativeCompact: true })` whose wording goes through `t()` rather than being
 * hardcoded English as it was here.
 */
export {
  asDynamicKey,
  defaultDateTimeParser,
  getCalendarDateStringForA11y,
  getDateString,
  getDateStringForA11y,
  isDate,
  isDayOrMoment,
  isNumberOrString,
  predefinedFormatters,
} from 'stream-chat/i18n';
