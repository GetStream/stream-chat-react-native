import React, { useContext } from 'react';
import Dayjs from 'dayjs';

import { getDisplayName } from '../utils/getDisplayName';

import type { TFunction } from 'i18next';
import type { Moment } from 'moment';

import type { UnknownType } from '../../types/types';

export const isDayOrMoment = (output: TDateTimeParserOutput): output is Dayjs.Dayjs | Moment =>
  (output as Dayjs.Dayjs | Moment).isSame != null;

export type TDateTimeParserInput = string | number | Date;

export type TDateTimeParserOutput = string | number | Date | Dayjs.Dayjs | Moment;

export type TDateTimeParser = (input?: TDateTimeParserInput) => TDateTimeParserOutput;

export type TranslationContextValue = {
  t: TFunction | ((key: string) => string);
  tDateTimeParser: TDateTimeParser;
};

export const TranslationContext = React.createContext<TranslationContextValue>({
  t: (key) => key,
  tDateTimeParser: (input) => Dayjs(input),
});

export const TranslationProvider: React.FC<{
  value: TranslationContextValue;
}> = ({ children, value }) => (
  <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
);

export const useTranslationContext = () => useContext(TranslationContext);

export const withTranslationContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof TranslationContextValue>> => {
  const WithTranslationContextComponent = (props: Omit<P, keyof TranslationContextValue>) => {
    const translationContext = useTranslationContext();

    return <Component {...(props as P)} {...translationContext} />;
  };
  WithTranslationContextComponent.displayName = `WithTranslationContext${getDisplayName(
    Component,
  )}`;
  return WithTranslationContextComponent;
};
