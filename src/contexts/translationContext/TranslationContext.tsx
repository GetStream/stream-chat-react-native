import React, { useContext } from 'react';
import Dayjs from 'dayjs';
import type { Moment } from 'moment';

export type TranslationContextValue = {
  t: (key: string) => string;
  tDateTimeParser: (
    input?: string | number | Date,
  ) => string | number | Date | Dayjs.Dayjs | Moment;
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

export const withTranslationContext = <P extends object>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof TranslationContextValue>> => (props) => {
  const translationContext = useTranslationContext();

  return <Component {...(props as P)} {...translationContext} />;
};
