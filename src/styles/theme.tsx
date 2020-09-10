import React from 'react';
import lodashGet from 'lodash/get';
import isPlainObject from 'lodash/isPlainObject';
import mapValues from 'lodash/mapValues';
import merge from 'lodash/merge';
import lodashSet from 'lodash/set';

import { ThemeConsumer, ThemeProvider } from './styledComponents';
import { defaultTheme } from './themeConstants';

// replaces
// { 'avatar.fallback': 'background-color: red;' }
// with
// { 'avatar.fallback': { css: 'background-color: red;' } }
const replaceCssShorthand = (
  style:
    | string
    | {
        [key: string]: string;
      },
): { [key: string]: string } | string => {
  const path: string[] = [];
  if (isPlainObject(style)) {
    const mapped = mapValues(
      style as { [key: string]: string },
      (styleItem, key) => {
        path.push(key);
        return replaceCssShorthand(styleItem) as string;
      },
    );
    path.pop();
    return mapped;
  }

  if (isPlainObject(lodashGet(defaultTheme, path.join('.')))) {
    path.pop();
    return { css: style } as { css: string };
  }
  path.pop();
  return style;
};

export const themed = <
  P extends Record<string, unknown> = Record<string, unknown>
>(
  OriginalComponent: React.ComponentType<P> & {
    themePath: string;
    extraThemePaths?: string[];
  },
): React.FC<P & { style?: { [key: string]: string } }> => {
  if (OriginalComponent.themePath == null) {
    throw Error('Only use themed on components that have a static themePath');
  }
  const ThemedComponent: React.FC<P & { style?: { [key: string]: string } }> & {
    themePath: string;
    extraThemePaths?: string[];
  } = ({ style, ...props }) => (
    <ThemeConsumer>
      {(themeProviderTheme) => {
        if (!style && themeProviderTheme) {
          return <OriginalComponent {...(props as P)} />;
        }
        let modifiedTheme = themeProviderTheme || defaultTheme;
        if (style) {
          const themeDiff = {};

          const formattedStyle = replaceCssShorthand(style) as {
            [key: string]: string;
          };
          for (const k in formattedStyle) {
            if (
              lodashGet(defaultTheme, OriginalComponent.themePath + '.' + k)
            ) {
              merge(
                themeDiff,
                lodashSet(
                  {},
                  OriginalComponent.themePath + '.' + k,
                  formattedStyle[k],
                ),
              );
            } else if (lodashGet(defaultTheme, k)) {
              merge(themeDiff, lodashSet({}, k, formattedStyle[k]));
            } else {
              throw Error(`Unknown theme key ${k}`);
            }
          }

          modifiedTheme = merge({}, modifiedTheme, themeDiff);
        }
        return (
          <ThemeProvider theme={modifiedTheme}>
            <OriginalComponent {...(props as P)} />
          </ThemeProvider>
        );
      }}
    </ThemeConsumer>
  );
  ThemedComponent.themePath = OriginalComponent.themePath;
  ThemedComponent.extraThemePaths = OriginalComponent.extraThemePaths;
  ThemedComponent.displayName = `Themed${getDisplayName(OriginalComponent)}`;
  return ThemedComponent;
};

// Copied from here:
// https://reactjs.org/docs/higher-order-components.html#convention-wrap-the-display-name-for-easy-debugging
function getDisplayName<P>(WrappedComponent: React.ComponentType<P>) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export const originalCSS = {};

export function setOriginalCSS(path: string, string: string) {
  // remove junk at the start and end of the code snippet
  string = string.split('`')[1].split('\n').slice(1, -2).join('\n');
  lodashSet(originalCSS, path + '.defaultCSS', string);
}
