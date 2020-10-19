import React from 'react';
import merge from 'lodash/merge';

import { replaceCssShorthand, ThemeType } from './utils/replaceCssShorthand';

import {
  StyledComponentsThemeProvider,
  useTheme,
} from '../../styles/styledComponents';
import { defaultTheme } from '../../styles/themeConstants';
import { formatDotNotation } from './utils/formatDotNotation';

export type ThemeProviderInputValue = {
  style?: ThemeType;
};

export const ThemeProvider: React.FC<ThemeProviderInputValue> = (props) => {
  const { children, style } = props;
  const theme = useTheme();
  const modifiedTheme = theme || defaultTheme;

  if (style) {
    const formattedStyle = replaceCssShorthand(style);
    const formattedTheme = formatDotNotation({ formattedStyle, modifiedTheme });
    merge(modifiedTheme, formattedTheme);
  }

  return (
    <StyledComponentsThemeProvider theme={modifiedTheme}>
      {children}
    </StyledComponentsThemeProvider>
  );
};
