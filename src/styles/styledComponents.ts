import * as styledComponents from 'styled-components/native';

import type { Theme } from './themeConstants';

declare module 'styled-components/native' {
  export interface DefaultTheme extends Theme {}
}

const {
  css,
  default: styled,
  ThemeConsumer,
  ThemeContext,
  ThemeProvider,
  useTheme,
  withTheme,
} = styledComponents as styledComponents.ReactNativeThemedStyledComponentsModule<
  Theme
>;

export {
  css,
  styled,
  ThemeConsumer,
  ThemeContext,
  ThemeProvider,
  useTheme,
  withTheme,
};
