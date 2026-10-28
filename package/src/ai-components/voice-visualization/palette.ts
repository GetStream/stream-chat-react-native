import { processColor } from 'react-native';

import type { Hsv } from './types';

export const MAXIMUM_COLORS = 5;

export type Rgb = [number, number, number];

/** Used when neither the `colors` prop nor the theme gives a readable color. */
export const FALLBACK_COLOR = '#005fff';

/**
 * Reads any color React Native understands (names, `#rgb[a]`, `#rrggbb[aa]`, `rgb()`, `hsl()`, ...)
 * into sRGB channels from 0 to 1, or null when it cannot be read. Platform colors have no
 * channels to read and count as unreadable.
 */
export const parseColor = (color: string): Rgb | null => {
  if (typeof color !== 'string' || !color.trim()) return null;
  const processed = processColor(color.trim());
  if (typeof processed !== 'number') return null;
  // 0xAARRGGBB, signed on Android.
  const argb = processed < 0 ? processed + 2 ** 32 : processed;
  const channel = (shift: number) => (Math.floor(argb / 2 ** shift) % 256) / 255;
  return [channel(16), channel(8), channel(0)];
};

/** RGB channels from 0 to 1 as HSV, keeping full saturation and value so muted colors render true. */
export const rgbToHsv = ([r, g, b]: Rgb): Hsv => {
  const high = Math.max(r, g, b);
  const low = Math.min(r, g, b);
  const delta = high - low;
  let hue = 0;
  if (delta !== 0) {
    if (high === r) hue = ((((g - b) / delta) % 6) + 6) % 6;
    else if (high === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  return {
    hue: (((hue / 6) % 1) + 1) % 1,
    saturation: high === 0 ? 0 : Math.min(Math.max(delta / high, 0), 1),
    value: Math.min(Math.max(high, 0), 1),
  };
};

/** Colors as the HSV the renderers read, at most five; colors that cannot be read are skipped. */
export const toHsvPalette = (colors: readonly string[]): Hsv[] =>
  colors
    .map(parseColor)
    .filter((rgb): rgb is Rgb => rgb !== null)
    .slice(0, MAXIMUM_COLORS)
    .map(rgbToHsv);

/** Relative luminance of a color, or null when it cannot be read. */
export const luminance = (color: string) => {
  const rgb = parseColor(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
