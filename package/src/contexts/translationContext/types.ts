import type { StreamTFunction } from '../../i18n/types';

/** The date/time parser types come from `@stream-io/i18n`, shared with the React SDK. */
export type { TDateTimeParser, TDateTimeParserInput, TDateTimeParserOutput } from '@stream-io/i18n';

export type TranslatorFunctions = {
  /**
   * The SDK's translation function. Typed as {@link StreamTFunction} so keys are checked against
   * the generated catalog and prose call sites pass their English copy inline. The typing is local,
   * not installed through i18next's `CustomTypeOptions`, which would constrain an app's own `t()`
   * calls.
   */
  t: StreamTFunction;
  tDateTimeParser: import('@stream-io/i18n').TDateTimeParser;
};
