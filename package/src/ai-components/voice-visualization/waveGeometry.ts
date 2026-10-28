import { Skia, type SkPath } from '@shopify/react-native-skia';

import { driverReact, driverScale, type VoiceDriverState } from './driver';
import { clamp, mix, saturate, smoothstep, speechEnv, vivid } from './math';

const POINTS = 160;
export const WAVE_STOPS = 13;
export const WAVE_START = -0.42;
export const WAVE_END = 0.42;

/** The stops' positions along the gradient, evenly spaced. */
export const WAVE_POSITIONS = Array.from({ length: WAVE_STOPS }, (_, s) => s / (WAVE_STOPS - 1));

const sq = (x: number) => {
  'worklet';
  return x * x;
};

const bandCenter = (i: number, seg: number, t: number) => {
  'worklet';
  switch (i) {
    case 0:
      return 0.5 * seg + 0.12 * Math.sin(t * 0.13);
    case 1:
      return 1.5 * seg + 0.13 * Math.sin(t * 0.11 + 2.1);
    case 2:
      return 2.5 * seg + 0.12 * Math.sin(t * 0.17 + 4.2);
    case 3:
      return 3.5 * seg + 0.12 * Math.sin(t * 0.15 + 1);
    default:
      return 4.5 * seg + 0.12 * Math.sin(t * 0.1 + 3.3);
  }
};

/** The string's height above its centre line at each point, centred and normalized, y up. */
export const waveHeights = (d: VoiceDriverState) => {
  'worklet';
  const t = d.time;
  const react = driverReact(d);
  const center = d.load * 0.3 * Math.sin(t * 1.3);
  const freq = 24 + 26 * react + 10 * d.flow;
  const speak = smoothstep(0.6, 1, react);
  const drive = mix(speak * 0.26 * speechEnv(t), 0.3 * d.mic, d.voice);
  const reach = 0.018 + 0.022 * react + drive + 0.14 * d.flow + 0.1 * d.load;
  const tapAlive = d.tapAge < 1.5;
  const hovered = d.hoverAmount > 0.001;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= POINTS; i++) {
    const x = WAVE_START + ((WAVE_END - WAVE_START) * i) / POINTS;
    let y = Math.exp(-sq((x - center) / 0.18)) * reach * Math.sin(x * freq - t * 5);
    if (tapAlive) {
      y +=
        Math.exp(-sq((x - d.tapX) / 0.12)) *
        Math.sin((x - d.tapX) * 40 - d.tapAge * 24) *
        Math.exp(-d.tapAge * 2.6) *
        0.05;
    }
    if (hovered) {
      y +=
        Math.exp(-sq((x - d.hoverX) / 0.12)) *
        Math.sin((x - d.hoverX) * 40 - t * 7) *
        d.hoverAmount *
        0.04;
    }
    xs.push(x);
    ys.push(y);
  }
  return { xs, ys };
};

type LegacyPath = SkPath & {
  lineTo: (x: number, y: number) => void;
  moveTo: (x: number, y: number) => void;
};

/**
 * The wave as a path in a `width` by `height` canvas. Newer Skia versions build immutable paths with
 * `PathBuilder`; earlier 2.x versions mutate `SkPath` itself.
 */
export const wavePath = (d: VoiceDriverState, width: number, height: number): SkPath => {
  'worklet';
  const m = Math.min(width, height);
  const scale = driverScale(d);
  const { xs, ys } = waveHeights(d);
  const px = (i: number) => width / 2 + xs[i] * m * scale;
  const py = (i: number) => height / 2 - ys[i] * m * scale;
  if (Skia.PathBuilder) {
    const builder = Skia.PathBuilder.Make();
    builder.moveTo(px(0), py(0));
    for (let i = 1; i < xs.length; i++) builder.lineTo(px(i), py(i));
    return builder.build();
  }
  const path = Skia.Path.Make() as LegacyPath;
  path.moveTo(px(0), py(0));
  for (let i = 1; i < xs.length; i++) path.lineTo(px(i), py(i));
  return path;
};

/**
 * The string's colors at its gradient stops, as RGBA from 0 to 1: up to five bands drifting along
 * it, weighed by how near their centres are, its ends fading out.
 */
export const waveColors = (d: VoiceDriverState, dark: number) => {
  'worklet';
  const band: number[][] = [];
  for (let i = 0; i < 5; i++) {
    const rgb = [0, 0, 0];
    vivid(d.colors[i], dark, rgb);
    band.push(rgb);
  }
  const seg = 1 / Math.max(d.count, 1);
  const bandWidth = seg * 0.7;
  const stops: Float32Array[] = [];
  for (let s = 0; s < WAVE_STOPS; s++) {
    const x = WAVE_START + ((WAVE_END - WAVE_START) * s) / (WAVE_STOPS - 1);
    const gx = clamp(x + 0.5, 0, 1);
    const color = [0, 0, 0];
    let total = 1e-4;
    for (let i = 0; i < 5; i++) {
      const present = i === 0 ? 1 : clamp(d.count - i, 0, 1);
      const weight = Math.exp(-sq((gx - bandCenter(i, seg, d.time)) / bandWidth)) * present;
      for (let j = 0; j < 3; j++) color[j] += band[i][j] * weight;
      total += weight;
    }
    for (let j = 0; j < 3; j++) color[j] /= total;
    saturate(color, 1.2);
    saturate(color, d.sat);
    const alpha = clamp(smoothstep(0.4, 0.24, Math.abs(x)) * d.bright, 0, 1);
    stops.push(new Float32Array([color[0], color[1], color[2], alpha]));
  }
  return stops;
};

/** The line is 0.6% of the shorter side, and never under 1.5 device pixels, as on Android and iOS. */
export const waveStrokeWidth = (width: number, height: number, pixelRatio: number) =>
  Math.max(0.006 * Math.min(width, height), 1.5 / pixelRatio);
