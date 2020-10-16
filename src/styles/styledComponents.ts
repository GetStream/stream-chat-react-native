import * as styledComponents from 'styled-components/native';

import type { Consumer, Context } from 'react';

import type { Theme } from './themeConstants';

declare module 'styled-components/native' {
  export interface DefaultTheme extends Theme {}
}

const appStyledComponents = styledComponents as styledComponents.ReactNativeThemedStyledComponentsModule<
  Theme
>;

const {
  css,
  default: styled,
  ThemeProvider,
  useTheme,
  withTheme,
} = appStyledComponents;

const ThemeConsumer = appStyledComponents.ThemeConsumer as Consumer<Theme>;
const ThemeContext = appStyledComponents.ThemeContext as Context<Theme>;

export {
  css,
  styled,
  ThemeConsumer,
  ThemeContext,
  ThemeProvider as StyledComponentsThemeProvider,
  useTheme,
  withTheme,
};
