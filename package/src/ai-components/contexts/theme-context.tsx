import React, { createContext, type PropsWithChildren, useContext, useMemo } from 'react';

import merge from 'lodash/merge';

import { defaultTheme, PALETTE_COLORED_PARTS, type Theme } from '../theme';

export type DeepPartial<T> = T extends (...args: never[]) => unknown
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
  // Icons are components, which the JSON copy below would drop and a deep merge would take apart,
  // so they are carried over as they are.
  const { icons: themeIcons, ...themeRest } = theme ?? {};
  const { icons: styleIcons, ...styleRest } = style ?? {};
  // TODO: Use structured-clone here or something similar.
  const finalTheme = (
    !theme || Object.keys(themeRest).length === 0
      ? JSON.parse(JSON.stringify(defaultTheme))
      : JSON.parse(JSON.stringify(themeRest))
  ) as Theme;

  if (style) {
    merge(finalTheme, styleRest);
    // The parts drawn in a palette color follow it when the style changes it, as for dark mode.
    const parts = styleRest as Record<string, Record<string, unknown> | undefined>;
    const sections = finalTheme as unknown as Record<string, Record<string, unknown>>;
    for (const [section, part, color] of PALETTE_COLORED_PARTS) {
      if (styleRest.colors?.[color] === undefined || parts[section]?.[part] !== undefined) continue;
      (sections[section] ??= {})[part] = finalTheme.colors[color];
    }
  }

  if (themeIcons || styleIcons) {
    finalTheme.icons = { ...themeIcons, ...styleIcons } as Theme['icons'];
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

  return <ThemeContext.Provider value={modifiedTheme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const theme = useContext(ThemeContext);

  if (theme === undefined) {
    throw new Error('The useTheme hook was called outside the StreamTheme Provider.');
  }
  return { theme };
};
