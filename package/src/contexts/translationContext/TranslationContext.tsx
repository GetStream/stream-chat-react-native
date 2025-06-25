import React, { useContext } from 'react';

import Dayjs from 'dayjs';

import type { TranslationLanguages } from 'stream-chat';

import { TranslatorFunctions } from './types';

import { defaultTranslatorFunction } from '../../utils/i18n/Streami18n';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export const DEFAULT_USER_LANGUAGE: TranslationLanguages = 'en';

export type TranslationContextValue = TranslatorFunctions & {
  userLanguage: TranslationLanguages;
};

const defaultTranslationContextValue: TranslationContextValue = {
  t: defaultTranslatorFunction,
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
      'The useTranslationContext hook was called outside the TranslationContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider)(https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider',
    );
  }

  return contextValue;
};
