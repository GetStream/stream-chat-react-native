import { advanceBounce, type BounceState, bounceScale, createBounce, startBounce } from './bounce';
import { MAXIMUM_COLORS } from './palette';
import type { Hsv, VoiceAgentState } from './types';

/**
 * The share of the way the live level moves each frame at 60 Hz, toward a louder or a quieter
 * level.
 */
export type LevelResponse = { rise: number; fall: number };

export const LEVEL_RESPONSE = {
  /** Follows the level closely, both ways. The glow's. */
  steady: { fall: 0.35, rise: 0.35 },
  /**
   * Follows the level like a VU meter: about 0.1 s up to a louder reading, about 0.3 s down from
   * it, so a meter's per-syllable jumps swell with the phrase instead. The wave's.
   */
  smooth: { fall: 0.05, rise: 0.16 },
} satisfies Record<string, LevelResponse>;

export type VoiceDriverInput = {
  state: VoiceAgentState;
  /** One to five colors. */
  colors: Hsv[];
  /** From 0 to 2. */
  expressivity: number;
  /** From 0 to 1, or null when no live audio drives the motion. */
  audioLevel: number | null;
  reduceMotion: boolean;
};

/**
 * The motion of a voice visualization: where it is in time, how it moves, and its colors. A plain
 * object rather than a class, so it can live in a shared value and be advanced on the UI thread.
 */
export type VoiceDriverState = {
  speed: number;
  bright: number;
  sat: number;
  load: number;
  flow: number;
  baseReact: number;
  expressivity: number;
  time: number;
  flowSpin: number;
  orbSpin: number;
  count: number;
  tapX: number;
  tapY: number;
  tapAge: number;
  hoverX: number;
  hoverY: number;
  hoverAmount: number;
  isHovering: boolean;
  mic: number;
  voice: number;
  /** The colors drawn, eased in place toward the input's color slots. */
  colors: Hsv[];
  bounce: BounceState;
  levelResponse: LevelResponse;
};

/**
 * How a state moves. `load`, `flow` and `react` each select a motion pattern, one per state, so
 * easing between states crossfades the patterns.
 */
type VoiceMotion = {
  bright: number;
  flow: number;
  load: number;
  react: number;
  sat: number;
  speed: number;
};

const MOTIONS: Record<VoiceAgentState, VoiceMotion> = {
  connecting: { bright: 1, flow: 0, load: 1, react: 0, sat: 1, speed: 1 },
  idle: { bright: 1, flow: 0, load: 0, react: 0.12, sat: 1, speed: 0.4 },
  listening: { bright: 1, flow: 0, load: 0, react: 0.45, sat: 1, speed: 0.9 },
  speaking: { bright: 1, flow: 0, load: 0, react: 1, sat: 1, speed: 1.25 },
  thinking: { bright: 1, flow: 1, load: 0, react: 0, sat: 1, speed: 1.25 },
};

export const NO_TAP = 100;
const MAX_FRAME = 0.05;
/** How fast time runs under reduced motion. */
export const REDUCED = 0.07;
const DRIVERS = 0.08;
const GENTLE = 0.12;
const VOICE = 0.1;

/** Expressivity scales amplitude and speed, each with a floor so the motion breathes at 0. */
export const scales = (expressivity: number) => {
  'worklet';
  return { amplitude: 0.15 + 0.85 * expressivity, speed: 0.6 + 0.4 * expressivity };
};

/**
 * The share of the way a value moves in `dt` seconds when it moves `perFrame` of the way each
 * frame at 60 Hz.
 */
export const ease = (perFrame: number, dt: number) => {
  'worklet';
  return 1 - Math.pow(1 - perFrame, dt * 60);
};

const rem = (x: number, m: number) => {
  'worklet';
  return ((x % m) + m) % m;
};

/** Eases an HSV color in place, its hue taking the shorter way round the wheel. */
const easeHsv = (color: Hsv, target: Hsv, fraction: number) => {
  'worklet';
  const hueStep = (rem(target.hue - color.hue + 1.5, 1) - 0.5) * fraction;
  color.hue = rem(color.hue + hueStep + 1, 1);
  color.saturation += (target.saturation - color.saturation) * fraction;
  color.value += (target.value - color.value) * fraction;
};

/** The five color slots the renderers read; past the palette they repeat its first color. */
export const slots = (colors: Hsv[]): Hsv[] => {
  'worklet';
  const first = colors[0] ?? { hue: 0, saturation: 0, value: 0 };
  const result: Hsv[] = [];
  for (let i = 0; i < MAXIMUM_COLORS; i++) result.push(colors[i] ?? first);
  return result;
};

/** A driver settled on `input`, so the first frame shows it rather than easing into it. */
export const createDriverState = (
  input: VoiceDriverInput,
  levelResponse: LevelResponse = LEVEL_RESPONSE.steady,
): VoiceDriverState => {
  const m = MOTIONS[input.state];
  const s = scales(input.expressivity);
  return {
    baseReact: m.react * s.amplitude,
    bounce: createBounce(),
    bright: m.bright,
    // Copies, as they are eased in place and the palette belongs to the caller.
    colors: slots(input.colors).map((color) => ({ ...color })),
    count: input.colors.length,
    expressivity: input.expressivity,
    flow: m.flow * s.amplitude,
    flowSpin: 0,
    hoverAmount: 0,
    hoverX: 0,
    hoverY: 0,
    isHovering: false,
    levelResponse,
    load: m.load * s.amplitude,
    mic: 0,
    orbSpin: 0,
    sat: m.sat,
    speed: m.speed * s.speed,
    tapAge: NO_TAP,
    tapX: 0,
    tapY: 0,
    time: 0,
    voice: 0,
  };
};

/** Live audio lifts the motion to its level, whatever the state. */
export const driverReact = (d: VoiceDriverState) => {
  'worklet';
  return d.baseReact + (Math.max(d.baseReact, d.mic) - d.baseReact) * d.voice;
};

/** The scale of a tap's bounce. */
export const driverScale = (d: VoiceDriverState) => {
  'worklet';
  return bounceScale(d.bounce);
};

/** A tap at (x, y), centred and normalized to the shorter side with y up. */
export const tapDriver = (d: VoiceDriverState, input: VoiceDriverInput, x: number, y: number) => {
  'worklet';
  if (input.reduceMotion) return;
  d.tapX = x;
  d.tapY = y;
  d.tapAge = 0;
  startBounce(d.bounce);
};

/** Where a pointer hovers, or null once it has left. */
export const hoverDriver = (
  d: VoiceDriverState,
  input: VoiceDriverInput,
  x: number | null,
  y: number | null,
) => {
  'worklet';
  if (x === null || y === null || input.reduceMotion) {
    d.isHovering = false;
    return;
  }
  d.hoverX = x;
  d.hoverY = y;
  d.isHovering = true;
};

/**
 * Advances the motion by `seconds`, easing each value toward the input's motion by a fixed share
 * per frame at 60 Hz, converted to time, so it moves the same at any refresh rate.
 */
export const advanceDriver = (d: VoiceDriverState, input: VoiceDriverInput, seconds: number) => {
  'worklet';
  // Clamped so a frame after a stall cannot leap the motion.
  const dt = Math.min(Math.max(seconds, 0), MAX_FRAME);
  if (input.reduceMotion) d.isHovering = false;
  const m = MOTIONS[input.state];
  const s = scales(input.expressivity);
  const drivers = ease(DRIVERS, dt);
  d.speed += (m.speed * s.speed - d.speed) * drivers;
  d.bright += (m.bright - d.bright) * drivers;
  d.sat += (m.sat - d.sat) * drivers;
  d.load += (m.load * s.amplitude - d.load) * drivers;
  d.flow += (m.flow * s.amplitude - d.flow) * drivers;
  d.baseReact += (m.react * s.amplitude - d.baseReact) * drivers;
  d.expressivity += (input.expressivity - d.expressivity) * drivers;
  // Integrated rather than computed as time times a weight, so a change of state eases the turns
  // instead of jumping their angles.
  const step = dt * (input.reduceMotion ? REDUCED : 1) * d.speed;
  d.time += step;
  d.flowSpin += step * d.flow;
  d.orbSpin += step * (1 + 0.5 * d.flow + 0.1 * d.baseReact);
  d.tapAge += dt;
  advanceBounce(d.bounce, dt);
  const gentle = ease(GENTLE, dt);
  d.hoverAmount += ((d.isHovering ? 1 : 0) - d.hoverAmount) * gentle;
  d.voice += ((input.audioLevel === null ? 0 : 1) - d.voice) * ease(VOICE, dt);
  const level = input.audioLevel ?? 0;
  const response = level > d.mic ? d.levelResponse.rise : d.levelResponse.fall;
  d.mic += (level - d.mic) * ease(response, dt);
  const targets = slots(input.colors);
  for (let i = 0; i < d.colors.length; i++) easeHsv(d.colors[i], targets[i], gentle);
  d.count += (input.colors.length - d.count) * gentle;
};
