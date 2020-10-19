import React, { useContext } from 'react';
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
  const modifiedTheme = defaultTheme;

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

  return {
    colors: theme.colors,
    theme,
  };
};
