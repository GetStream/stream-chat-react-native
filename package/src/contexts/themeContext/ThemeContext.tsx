import React, { useContext, useMemo } from 'react';

import merge from 'lodash/merge';

import { defaultTheme, Theme } from './utils/theme';

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type ThemeProviderInputValue = {
  mergedStyle?: Theme;
  style?: DeepPartial<Theme>;
};

export type MergedThemesParams = {
  style?: DeepPartial<Theme>;
  theme?: Theme;
};

export const mergeThemes = (params: MergedThemesParams) => {
  const { style, theme } = params;
  const finalTheme = (
    !theme || Object.keys(theme).length === 0
      ? JSON.parse(JSON.stringify(defaultTheme))
      : JSON.parse(JSON.stringify(theme))
  ) as Theme;

  if (style) {
    merge(finalTheme, style);
  }

  return finalTheme;
};

export const ThemeContext = React.createContext({} as Theme);

export const ThemeProvider: React.FC<ThemeProviderInputValue> = (props) => {
  const { children, mergedStyle, style } = props;
  const { theme } = useTheme();
  const modifiedTheme = useMemo(() => {
    if (mergedStyle) {
      return mergedStyle;
    }

    return mergeThemes({ style, theme });
  }, [mergedStyle, style, theme]);

  return <ThemeContext.Provider value={modifiedTheme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const theme = useContext(ThemeContext);

  return { theme };
};
