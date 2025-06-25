import Dayjs from 'dayjs';

import type { Moment } from 'moment-timezone';

import { TDateTimeParserOutput } from './types';

export const isDayOrMoment = (output: TDateTimeParserOutput): output is Dayjs.Dayjs | Moment =>
  (output as Dayjs.Dayjs | Moment).isSame != null;
