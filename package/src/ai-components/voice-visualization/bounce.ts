/**
 * The bounce of a tap: a dip to 93% and an overshoot to 103% before settling, over 340 ms.
 *
 * These are authored keyframes rather than a spring: the ease-out curve times the whole run and
 * the keyframes are linear between their stops.
 */
export const BOUNCE_DURATION = 0.34;

const OFFSETS = [0, 0.3, 0.62, 1];
const SCALES = [1, 0.93, 1.03, 1];

/** How long ago the last bounce started, in seconds; infinite before the first. */
export type BounceState = { age: number };

export const createBounce = (): BounceState => ({ age: Number.POSITIVE_INFINITY });

export const startBounce = (bounce: BounceState) => {
  'worklet';
  bounce.age = 0;
};

export const advanceBounce = (bounce: BounceState, seconds: number) => {
  'worklet';
  bounce.age += seconds;
};

/** CSS `ease-out`, `cubic-bezier(0, 0, 0.58, 1)`. */
export const easeOut = (x: number) => {
  'worklet';
  const bx = 3 * 0.58;
  const ax = 1 - bx;
  const by = 3;
  const ay = 1 - by;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 24; i++) {
    const middle = (low + high) / 2;
    if ((ax * middle + bx) * middle * middle < x) low = middle;
    else high = middle;
  }
  const t = (low + high) / 2;
  return (ay * t + by) * t * t;
};

/** The keyframed scale at `progress`, from 0 to 1. */
export const scaleAt = (progress: number) => {
  'worklet';
  for (let i = 1; i < OFFSETS.length; i++) {
    if (progress <= OFFSETS[i]) {
      const fraction = (progress - OFFSETS[i - 1]) / (OFFSETS[i] - OFFSETS[i - 1]);
      return SCALES[i - 1] + (SCALES[i] - SCALES[i - 1]) * fraction;
    }
  }
  return 1;
};

export const bounceScale = (bounce: BounceState) => {
  'worklet';
  if (bounce.age >= BOUNCE_DURATION) return 1;
  return scaleAt(easeOut(Math.max(bounce.age, 0) / BOUNCE_DURATION));
};
