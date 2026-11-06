import type { TextStyle } from 'react-native';

import type { ConvertOpts, CSSP } from '../types';

const EM_DEFAULT = 16;

// Style properties are readonly in React Native's strict TypeScript API.
type MutableTextStyle = { -readonly [K in keyof TextStyle]: TextStyle[K] };

/** Parses a CSS length such as 14, "14px", "1.25em" or "0.875rem" into a number. */
const len = (v: unknown, { baseFontSize, rootFontSize }: ConvertOpts): number | undefined => {
  if (v == null) return undefined;
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return undefined;

  const s = v.trim().toLowerCase();
  if (s.endsWith('px')) {
    const n = Number(s.slice(0, -2));
    return Number.isFinite(n) ? n : undefined;
  }
  if (s.endsWith('em')) {
    const n = Number(s.slice(0, -2));
    return Number.isFinite(n) ? n * (baseFontSize ?? EM_DEFAULT) : undefined;
  }
  if (s.endsWith('rem')) {
    const n = Number(s.slice(0, -3));
    const root = rootFontSize ?? baseFontSize ?? EM_DEFAULT;
    return Number.isFinite(n) ? n * root : undefined;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

/** Parses a CSS `font` shorthand such as "italic small-caps 700 14px/20px Menlo, monospace". */
const parseFontShorthand = (v: string, opts: ConvertOpts) => {
  const out: MutableTextStyle = {};
  const parts = v.split(/\s+/);
  // Reads in order: style, small-caps, weight, size[/lineHeight], then the family (everything after
  // the size token, which may contain commas and spaces).
  let i = 0;

  if (parts[i] === 'italic' || parts[i] === 'normal') {
    if (parts[i] !== 'normal') out.fontStyle = 'italic';
    i++;
  }

  // RN models `small-caps` as `fontVariant`.
  if (parts[i] === 'small-caps') {
    out.fontVariant = ['small-caps'];
    i++;
  }

  if (/^(normal|bold|[1-9]00)$/.test(parts[i] ?? '')) {
    const token = parts[i]!;
    out.fontWeight = (token === 'normal' ? undefined : token) as TextStyle['fontWeight'];
    i++;
  }

  const sizeToken = parts[i];
  if (
    sizeToken &&
    (/.+(px|em|rem)$/.test(sizeToken) || /^[\d.]+(\/[\d.]+)?(px|em|rem)?$/.test(sizeToken))
  ) {
    const [fs, lh] = sizeToken.split('/');
    const fontSize = len(fs, opts);
    if (fontSize != null) out.fontSize = fontSize;
    if (lh) {
      const lineHeight = len(lh, opts);
      if (lineHeight != null) out.lineHeight = lineHeight;
    }
    i++;
  }

  const family = parts.slice(i).join(' ').replace(/^,|,$/g, '').trim();
  if (family) {
    // Only the first family is kept, without quotes.
    const first = family
      .split(',')[0]
      ?.trim()
      .replace(/^["']|["']$/g, '');
    if (first) out.fontFamily = first;
  }

  return out;
};

/**
 * Converts web CSS properties to an RN `TextStyle`.
 *
 * @param css The CSS properties to convert.
 * @param options Font size bases for `em` and `rem` units.
 * @returns The equivalent `TextStyle`.
 */
export const cssToRNTextStyle = (css: Partial<CSSP>, options: ConvertOpts = {}): TextStyle => {
  const opts: ConvertOpts = {
    baseFontSize: options.baseFontSize ?? EM_DEFAULT,
    rootFontSize: options.rootFontSize ?? options.baseFontSize ?? EM_DEFAULT,
  };

  const out: MutableTextStyle = {};

  if (css.color) out.color = String(css.color);

  if (css.fontFamily) out.fontFamily = String(css.fontFamily);
  if (css.fontStyle) out.fontStyle = css.fontStyle as TextStyle['fontStyle'];
  if (css.fontWeight) out.fontWeight = String(css.fontWeight) as TextStyle['fontWeight'];

  if (css.fontSize != null) {
    const n = len(css.fontSize, opts);
    if (n != null) out.fontSize = n;
  }

  if (css.lineHeight != null) {
    const n = len(css.lineHeight, opts);
    if (n != null) out.lineHeight = n;
  }

  if (css.letterSpacing != null) {
    const n = len(css.letterSpacing, opts);
    if (n != null) out.letterSpacing = n;
  }

  if (css.textAlign) out.textAlign = css.textAlign as TextStyle['textAlign'];

  if (css.font && typeof css.font === 'string') {
    Object.assign(out, parseFontShorthand(css.font, opts));
  }

  // Maps the CSS overflow values to the closest RN `overflow`.
  const overflowLike = css.overflow ?? css.overflowX ?? css.overflowY;
  if (typeof overflowLike === 'string') {
    out.overflow =
      overflowLike === 'hidden'
        ? 'hidden'
        : overflowLike === 'scroll' || overflowLike === 'auto'
          ? 'scroll'
          : 'visible';
  }

  return out as TextStyle;
};
