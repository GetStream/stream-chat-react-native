import { useMemo } from 'react';

/**
 * Returns true if `uri` points to an SVG (either by `.svg` extension or by
 * `image/svg+xml` data-URI prefix). Exported as a pure function for non-React
 * callers; React components should prefer `useIsSvg` so the check is memoized
 * per URI.
 */
export const isSvgUri = (uri: string | null | undefined): boolean => {
  if (typeof uri !== 'string' || uri.length === 0) {
    return false;
  }
  const lower = uri.toLowerCase();
  if (lower.startsWith('data:image/svg+xml')) {
    return true;
  }
  const pathOnly = lower.split('#')[0].split('?')[0];
  return pathOnly.endsWith('.svg');
};

/**
 * Memoized variant of `isSvgUri`. Re-runs the string check only when `uri`
 * actually changes — useful in hot render paths like the gallery where the
 * surrounding component re-renders frequently (animated styles, swipe state)
 * but the URI is stable.
 */
export const useIsSvg = (uri: string | null | undefined): boolean =>
  useMemo(() => isSvgUri(uri), [uri]);
