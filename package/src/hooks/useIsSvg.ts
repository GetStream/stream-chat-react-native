import { useMemo } from 'react';

/**
 * Whether `uri` points to an SVG, by `.svg` extension (ignoring query and fragment) or by
 * `image/svg+xml` data URI. The non-hook form of `useIsSvg`.
 *
 * @param uri The URI to check.
 * @returns True when the URI is an SVG.
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
 * Memoized `isSvgUri`, re-evaluated only when `uri` changes.
 *
 * @param uri The URI to check.
 * @returns True when the URI is an SVG.
 */
export const useIsSvg = (uri: string | null | undefined): boolean =>
  useMemo(() => isSvgUri(uri), [uri]);
