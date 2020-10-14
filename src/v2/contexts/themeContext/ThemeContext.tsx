import React from 'react';
import merge from 'lodash/merge';

import { replaceCssShorthand, ThemeType } from './utils/replaceCssShorthand';

import { ThemeProvider as StyledComponentsThemeProvider } from '../../../styles/styledComponents';
import { defaultTheme } from '../../../styles/themeConstants';

export type ThemeProviderInputValue = {
  style?: ThemeType;
};

export const ThemeProvider: React.FC<ThemeProviderInputValue> = (props) => {
  const { children, style } = props;
  const modifiedTheme = defaultTheme;

  if (style) {
    const formattedStyle = replaceCssShorthand(style);
    merge(modifiedTheme, formattedStyle);
  }

  return (
    <StyledComponentsThemeProvider theme={modifiedTheme}>
      {children}
    </StyledComponentsThemeProvider>
  );
};
