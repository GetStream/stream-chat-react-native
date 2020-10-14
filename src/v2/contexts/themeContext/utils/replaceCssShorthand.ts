import lodashGet from 'lodash/get';
import isPlainObject from 'lodash/isPlainObject';
import mapValues from 'lodash/mapValues';

import { defaultTheme } from '../../../../styles/themeConstants';

export type ThemeType = {
  [key: string]: string | number | boolean | ThemeType;
};

// replaces
// { 'avatar.fallback': 'background-color: red;' }
// with
// { 'avatar.fallback': { css: 'background-color: red;' } }
export const replaceCssShorthand = (
  style: ThemeType | string | number | boolean,
): ThemeType | string | number | boolean => {
  const path: string[] = [];
  if (isPlainObject(style)) {
    const mapped = mapValues(style as ThemeType, (styleItem, key) => {
      path.push(key);
      return replaceCssShorthand(styleItem);
    });
    path.pop();
    return mapped;
  }

  if (isPlainObject(lodashGet(defaultTheme, path.join('.')))) {
    path.pop();
    return { css: style };
  }
  path.pop();
  return style;
};
