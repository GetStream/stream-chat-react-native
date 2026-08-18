import Dayjs from 'dayjs';

import type { Moment } from 'moment-timezone';

import type { StreamTFunction } from '../../i18n/types';

export type TDateTimeParserInput = string | number | Date;

export type TDateTimeParserOutput = string | number | Date | Dayjs.Dayjs | Moment;

export type TDateTimeParser = (input?: TDateTimeParserInput) => TDateTimeParserOutput;

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
  tDateTimeParser: TDateTimeParser;
};
