import lodashGet from 'lodash/get';
import isPlainObject from 'lodash/isPlainObject';
import merge from 'lodash/merge';
import lodashSet from 'lodash/set';

import type { ThemeType } from './replaceCssShorthand';

import type { Theme } from '../../../styles/themeConstants';

export type FormatDotNotationParams = {
  formattedStyle: string | number | boolean | ThemeType;
  modifiedTheme: Theme;
};

export const formatDotNotation = ({
  formattedStyle,
  modifiedTheme,
}: FormatDotNotationParams) => {
  if (isPlainObject(formattedStyle)) {
    const themeDiff = {};
    for (const k in formattedStyle as ThemeType) {
      if (lodashGet(modifiedTheme, k)) {
        merge(themeDiff, lodashSet({}, k, (formattedStyle as ThemeType)[k]));
      } else {
        throw Error(`Unknown theme key ${k}`);
      }
    }
    return themeDiff;
  }
  return modifiedTheme;
};
