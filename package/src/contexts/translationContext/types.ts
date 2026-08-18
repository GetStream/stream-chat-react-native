import type { StreamTFunction } from '../../i18n/types';

/**
 * The date/time parser types come from `stream-chat/i18n`, shared with the React SDK.
 *
 * They used to be declared here, and `TDateTimeParserOutput` referenced `Moment` from
 * `moment-timezone` — a *devDependency*, so the type leaked into the published `.d.ts` and failed to
 * resolve for any consumer who had not separately installed it. Core's structural `DateTimeLike`
 * covers a Dayjs or a Moment without depending on either.
 */
export type {
  TDateTimeParser,
  TDateTimeParserInput,
  TDateTimeParserOutput,
} from 'stream-chat/i18n';

export type TranslatorFunctions = {
  /**
   * The SDK's translation function.
   *
   * Typed as {@link StreamTFunction} rather than i18next's `TFunction`, so a key is checked against
   * the generated catalog and prose call sites are required to pass their English copy inline. The
   * typing is deliberately local: installing it through i18next's `CustomTypeOptions` would be
   * global and would force an integrator's own unrelated `t()` calls to satisfy our key union.
   */
  t: StreamTFunction;
  tDateTimeParser: import('stream-chat/i18n').TDateTimeParser;
};
