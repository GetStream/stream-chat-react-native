import React, { useContext, useMemo } from 'react';
import merge from 'lodash/merge';

import { defaultTheme, Theme } from './utils/theme';

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type ThemeProviderInputValue = {
  style?: DeepPartial<Theme>;
};

export const ThemeContext = React.createContext({} as Theme);

export const ThemeProvider: React.FC<ThemeProviderInputValue> = (props) => {
  const { children, style } = props;
  const { theme } = useTheme();
  const modifiedTheme = useMemo(
    () =>
      Object.keys(theme).length === 0
        ? JSON.parse(JSON.stringify(defaultTheme))
        : JSON.parse(JSON.stringify(theme)),
    [theme],
  );

  if (style) {
    merge(modifiedTheme, style);
  }

  return (
    <ThemeContext.Provider value={modifiedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const theme = useContext(ThemeContext);

  return { theme };
};
