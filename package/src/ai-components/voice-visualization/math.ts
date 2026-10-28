import { snoise } from './simplex';

/** The shader math the wave runs on the CPU, once per frame, on the UI thread. */

export const mix = (a: number, b: number, t: number) => {
  'worklet';
  return a + (b - a) * t;
};

export const fract = (x: number) => {
  'worklet';
  return x - Math.floor(x);
};

export const clamp = (x: number, low: number, high: number) => {
  'worklet';
  return Math.min(Math.max(x, low), high);
};

/** GLSL's smoothstep, evaluated the same with its edges either way round. */
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  'worklet';
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** HSV, hue a fraction of a turn, into `out` as RGB. */
export const hsvToRgb = (hue: number, saturation: number, value: number, out: number[]) => {
  'worklet';
  for (let i = 0; i < 3; i++) {
    const k = i === 0 ? 1 : i === 1 ? 2 / 3 : 1 / 3;
    const p = Math.abs(fract(hue + k) * 6 - 3);
    out[i] = value * mix(1, clamp(p - 1, 0, 1), saturation);
  }
};

/** A palette color as is; dark mode lifts saturation a touch so it stays vivid on black. */
export const vivid = (
  color: { hue: number; saturation: number; value: number },
  dark: number,
  out: number[],
) => {
  'worklet';
  hsvToRgb(color.hue, clamp(color.saturation + dark * 0.06, 0, 1), color.value, out);
};

/** Pushes `c` away from its luminance by `amount`; below 1 desaturates. */
export const saturate = (c: number[], amount: number) => {
  'worklet';
  const l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  for (let i = 0; i < 3; i++) c[i] = clamp(mix(l, c[i], amount), 0, 1);
};

/**
 * How much the agent is talking, 0 to 1: a slow phrase gate times a faster syllable wobble. The
 * shader's own envelope, on the same simplex noise, so the wave and the glow speak alike.
 */
export const speechEnv = (t: number) => {
  'worklet';
  const gate = smoothstep(-0.25, 0.35, snoise(t * 0.6, 21, 0));
  const syllable = 0.55 + 0.45 * snoise(t * 3, 5, 0);
  return clamp(gate * syllable, 0, 1);
};

/** `expressivity` from 0 to 2; one that is not a number gets the default, 1. */
export const expressivityInput = (expressivity: number | undefined) =>
  typeof expressivity === 'number' && Number.isFinite(expressivity) ? clamp(expressivity, 0, 2) : 1;

/** `level` from 0 to 1; one that is not a number counts as no live audio, so it can't stall the motion. */
export const audioLevelInput = (level: number | null | undefined) => {
  'worklet';
  return typeof level === 'number' && Number.isFinite(level) ? clamp(level, 0, 1) : null;
};
