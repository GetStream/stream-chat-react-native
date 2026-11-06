import {
  createDefaultTranslatorFunction,
  getCalendarDateStringForA11y as coreGetCalendarDateStringForA11y,
  getDateString as coreGetDateString,
  getDateStringForA11y as coreGetDateStringForA11y,
} from '@stream-io/i18n';

import type { StreamTFunction } from './types';

/**
 * The `t` used before i18next has initialized, and the default value of the translation context.
 *
 * The default translator from `@stream-io/i18n`, typed against this SDK's catalog. It honors the
 * inline `defaultValue` at each call site, so raw dotted keys neither flash on the first frame nor
 * render permanently in a component used outside `<OverlayProvider>`.
 */
export const defaultTranslatorFunction: StreamTFunction =
  createDefaultTranslatorFunction() as StreamTFunction;

/** The date/time and key helpers come from `@stream-io/i18n`, shared with the React SDK. */
export {
  asDynamicKey,
  defaultDateTimeParser,
  isDate,
  isDayOrMoment,
  isNumberOrString,
  predefinedFormatters,
} from '@stream-io/i18n';

/**
 * `null` means nothing renderable, which every caller handles by omitting the element. Day.js
 * formats an unparseable instance as "Invalid Date", which must not reach the screen as copy.
 */
const withoutInvalidDate = <T>(result: T) =>
  typeof result === 'string' && result.includes('Invalid Date') ? null : result;

/**
 * This SDK's date formatters: the `@stream-io/i18n` ones, with an invalid result suppressed.
 *
 * Timestamps are not rescaled: server timestamps are nanosecond numbers converted with
 * `convertTimestampToDate` where server data enters the tree, so a missed conversion surfaces
 * instead of being masked.
 *
 * @param params Same options as `getDateString` from `@stream-io/i18n`.
 * @returns The formatted date, or `null` when there is nothing renderable.
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
