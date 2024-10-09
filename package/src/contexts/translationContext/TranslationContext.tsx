import React, { useContext } from 'react';

import Dayjs from 'dayjs';

import type { TFunction } from 'i18next';
import type { Moment } from 'moment-timezone';

import type { TranslationLanguages } from 'stream-chat';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export const DEFAULT_USER_LANGUAGE: TranslationLanguages = 'en';

export const isDayOrMoment = (output: TDateTimeParserOutput): output is Dayjs.Dayjs | Moment =>
  (output as Dayjs.Dayjs | Moment).isSame != null;

export type TDateTimeParserInput = string | number | Date;

export type TDateTimeParserOutput = string | number | Date | Dayjs.Dayjs | Moment;

export type TDateTimeParser = (input?: TDateTimeParserInput) => TDateTimeParserOutput;

export type TranslatorFunctions = {
  t: TFunction | ((key: string) => string);
  tDateTimeParser: TDateTimeParser;
};

export type TranslationContextValue = TranslatorFunctions & {
  userLanguage: TranslationLanguages;
};

const defaultTranslationContextValue: TranslationContextValue = {
  t: (key: string) => key,
  tDateTimeParser: (input) => Dayjs(input),
  userLanguage: DEFAULT_USER_LANGUAGE,
};

export const TranslationContext = React.createContext<TranslationContextValue>(
  defaultTranslationContextValue,
);

type Props = React.PropsWithChildren<{
  value: TranslationContextValue;
}>;

export const TranslationProvider = ({ children, value }: Props) => (
  <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
);

export const useTranslationContext = () => {
  const contextValue = useContext(TranslationContext);

  if (contextValue === defaultTranslationContextValue && !isTestEnvironment()) {
    throw new Error(
      `The useTranslationContext hook was called outside the TranslationContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider)(https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider`,
    );
  }

  return contextValue;
};
