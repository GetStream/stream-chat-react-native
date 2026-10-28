import { LEVEL_RESPONSE, type LevelResponse } from './driver';

/**
 * What tells the glow and the wave apart besides how they draw, as on iOS.
 *
 * - `levelResponse`: the wave's height tracks the level directly, so it follows it smoothly;
 *   per-syllable jumps would make it jitter. The glow follows it closely.
 * - `maxScale`: the densest it renders. The glow is soft all over, so 2x is enough; the wave's
 *   thin line is drawn at the screen's own scale, up to 3x, to stay crisp.
 * - `contains`: whether a point, centred and normalized to the shorter side with y up, is on the
 *   shape rather than the empty space around it.
 */
export type VoiceVisualizationStyle = {
  contains: (x: number, y: number) => boolean;
  /** The shape's bounds as a share of the shorter side, for the area that takes touches. */
  hitArea: { width: number; height: number };
  levelResponse: LevelResponse;
  maxScale: number;
};

/** How far from the centre a tap still lands on the globe, as a share of the shorter side. */
const GLOBE_REACH = 0.32;

export const GLOW_STYLE: VoiceVisualizationStyle = {
  contains: (x, y) => {
    'worklet';
    return Math.hypot(x, y) < GLOBE_REACH;
  },
  hitArea: { height: 2 * GLOBE_REACH, width: 2 * GLOBE_REACH },
  levelResponse: LEVEL_RESPONSE.steady,
  maxScale: 2,
};

export const WAVE_STYLE: VoiceVisualizationStyle = {
  contains: (x, y) => {
    'worklet';
    return Math.abs(x) < 0.5 && Math.abs(y) < 0.14;
  },
  hitArea: { height: 0.28, width: 1 },
  levelResponse: LEVEL_RESPONSE.smooth,
  maxScale: 3,
};
