import React, { useContext } from 'react';
import Dayjs from 'dayjs';
import type { Moment } from 'moment';

export const isDayOrMoment = (
  output: TDateTimeParserOutput,
): output is Dayjs.Dayjs | Moment =>
  (output as Dayjs.Dayjs | Moment).isSame != null;

export type TDateTimeParserInput = string | number | Date;

export type TDateTimeParserOutput =
  | string
  | number
  | Date
  | Dayjs.Dayjs
  | Moment;

export type TDateTimeParser = (
  input?: TDateTimeParserInput,
) => TDateTimeParserOutput;

export type TranslationContextValue = {
  t: (key: string) => string;
  tDateTimeParser: TDateTimeParser;
};

export const TranslationContext = React.createContext<TranslationContextValue>({
  t: (key) => key,
  tDateTimeParser: (input) => Dayjs(input),
});

export const TranslationProvider: React.FC<{
  value: TranslationContextValue;
}> = ({ children, value }) => (
  <TranslationContext.Provider value={value}>
    {children}
  </TranslationContext.Provider>
);

export const useTranslationContext = () => useContext(TranslationContext);
