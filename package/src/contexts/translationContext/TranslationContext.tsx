import React, { useContext } from 'react';

import Dayjs from 'dayjs';

import type { TFunction } from 'i18next';
import type { Moment } from 'moment-timezone';

import type { TranslationLanguages } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';
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

/**
 * @deprecated
 *
 * This will be removed in the next major version.
 *
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withTranslationContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withTranslationContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<StreamChatGenerics>,
): React.ComponentType<Omit<StreamChatGenerics, keyof TranslationContextValue>> => {
  const WithTranslationContextComponent = (
    props: Omit<StreamChatGenerics, keyof TranslationContextValue>,
  ) => {
    const translationContext = useTranslationContext();

    return <Component {...(props as StreamChatGenerics)} {...translationContext} />;
  };
  WithTranslationContextComponent.displayName = `WithTranslationContext${getDisplayName(
    Component as React.ComponentType,
  )}`;
  return WithTranslationContextComponent;
};
