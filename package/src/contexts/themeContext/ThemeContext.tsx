import React, { PropsWithChildren, useContext, useMemo } from 'react';

import { ColorSchemeName, useColorScheme } from 'react-native';

import merge from 'lodash/merge';

import { defaultTheme, Theme } from './utils/theme';

import { darkSemantics, lightSemantics } from '../../theme';

import { resolveTokensTopologically } from '../../theme/topologicalResolution';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

/**
 * A custom theme passed to `<Chat style={...}>` / `<ThemeProvider style={...}>`: either a partial
 * override tree or a complete `Theme`.
 *
 * `Theme` is listed first because a full `Theme` is structurally a valid `DeepPartial<Theme>`, but
 * with React Native 0.87 style types, proving that exceeds TypeScript's instantiation depth limit
 * (TS2589). Matching `Theme` directly avoids the `as DeepPartial<Theme>` cast.
 */
export type ThemeStyle = Theme | DeepPartial<Theme>;

export type ThemeProviderInputValue = {
  mergedStyle?: Theme;
  style?: ThemeStyle;
};

export type MergedThemesParams = {
  style?: ThemeStyle;
  theme?: Theme;
  scheme?: ColorSchemeName | null;
};

export type ThemeContextValue = {
  theme: Theme;
};

export const mergeThemes = (params: MergedThemesParams) => {
  const { style, theme, scheme } = params;
  const baseTheme = (
    !theme || Object.keys(theme).length === 0
      ? JSON.parse(JSON.stringify(defaultTheme))
      : JSON.parse(JSON.stringify(theme))
  ) as Theme;

  let semantics = scheme === 'dark' ? darkSemantics : lightSemantics;
  if (theme?.semantics) {
    semantics = { ...semantics, ...theme.semantics };
  }
  semantics = resolveTokensTopologically(semantics);

  const finalTheme = { ...baseTheme, semantics };

  if (style) {
    merge(finalTheme, style);
  }

  return finalTheme;
};

export const ThemeContext = React.createContext(DEFAULT_BASE_CONTEXT_VALUE as Theme);

export const ThemeProvider = (
  props: PropsWithChildren<ThemeProviderInputValue & Partial<ThemeContextValue>>,
) => {
  const { children, mergedStyle, style, theme } = props;

  const scheme = useColorScheme();

  const modifiedTheme = useMemo(() => {
    if (mergedStyle) {
      return mergedStyle;
    }

    return mergeThemes({ style, theme, scheme });
  }, [mergedStyle, style, theme, scheme]);

  return <ThemeContext.Provider value={modifiedTheme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const theme = useContext(ThemeContext);

  if (theme === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useThemeContext hook was called outside the ThemeContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/overlay-provider/',
    );
  }
  return { theme };
};
