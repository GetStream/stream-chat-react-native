import React, { useContext } from 'react';

import { TranslatorFunctions } from './types';

import { defaultDateTimeParser, defaultTranslatorFunction } from '../../i18n/utils';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export const DEFAULT_USER_LANGUAGE = 'en';

export type TranslationContextValue = TranslatorFunctions & {
  /**
   * The language the SDK's own copy renders in. A plain `string` rather than `stream-chat`'s
   * `TranslationLanguage` (the message auto-translation languages): any language with a registered
   * dictionary is valid.
   */
  userLanguage: string;
};

const defaultTranslationContextValue: TranslationContextValue = {
  t: defaultTranslatorFunction,
  tDateTimeParser: defaultDateTimeParser,
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
      'The useTranslationContext hook was called outside the TranslationContextProvider',
    );
  }

  return contextValue;
};
