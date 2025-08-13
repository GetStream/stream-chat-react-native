import Dayjs from 'dayjs';

import type { TFunction } from 'i18next';
import type { Moment } from 'moment-timezone';

export type TDateTimeParserInput = string | number | Date;

export type TDateTimeParserOutput = string | number | Date | Dayjs.Dayjs | Moment;

export type TDateTimeParser = (input?: TDateTimeParserInput) => TDateTimeParserOutput;

export type TranslatorFunctions = {
  t: TFunction;
  tDateTimeParser: TDateTimeParser;
};
