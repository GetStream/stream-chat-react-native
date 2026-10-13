import React, {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';

import { merge } from 'lodash';

import { defaultTheme, type Theme } from '../theme';

export type DeepPartial<T> = T extends (...args: any) => any
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type StreamThemeInputValue = {
  mergedStyle?: Theme;
  style?: DeepPartial<Theme>;
};

export type MergedThemesParams = {
  style?: DeepPartial<Theme>;
  theme?: Theme;
};

export type ThemeContextValue = {
  theme: Theme;
};

export const mergeThemes = (params: MergedThemesParams) => {
  const { style, theme } = params;
  // TODO: Use structured-clone here or something similar.
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

export const ThemeContext = createContext<Theme | undefined>(undefined);

export const StreamTheme = (
  props: PropsWithChildren<StreamThemeInputValue & Partial<ThemeContextValue>>,
) => {
  const { children, mergedStyle, style, theme } = props;

  const modifiedTheme = useMemo(() => {
    if (mergedStyle) {
      return mergedStyle;
    }

    return mergeThemes({ style, theme });
  }, [mergedStyle, style, theme]);

  return (
    <ThemeContext.Provider value={modifiedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const theme = useContext(ThemeContext);

  if (theme === undefined) {
    throw new Error(
      'The useTheme hook was called outside the StreamTheme Provider.',
    );
  }
  return { theme };
};
