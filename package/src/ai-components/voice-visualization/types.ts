import type { ViewProps } from 'react-native';

import type { SharedValue } from 'react-native-reanimated';

/**
 * What a voice agent is doing, which a voice visualization shows as motion.
 *
 * The states differ only in how a visualization moves, never in its colors, and changing the
 * state eases from one motion into the next.
 *
 * - `idle`: waiting to be spoken to, a calm, barely-there shimmer.
 * - `connecting`: not ready yet, a loader sweep with a pulsing breath.
 * - `listening`: hearing somebody, a gentle expand and contract.
 * - `thinking`: working on an answer, a slow turn or a travelling wave.
 * - `speaking`: talking, strong motion that ebbs and pauses like speech.
 */
export type VoiceAgentState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

export type VoiceVisualizationProps = Omit<ViewProps, 'children'> & {
  /** What the agent is doing, which sets how the visualization moves. */
  state: VoiceAgentState;
  /**
   * The level of whoever is talking, from 0 to 1, read once a frame on the UI thread. Feed it at
   * 15 Hz or more for the visualization to move with the words; `null` animates speech on its own.
   * See `useDictationAudioLevel` for the level of the microphone while dictating.
   */
  audioLevel?: SharedValue<number | null>;
  /**
   * One to five colors. Past five are ignored, and colors that cannot be read are skipped. When
   * omitted or empty, the theme's `voiceVisualization.colors` are used.
   */
  colors?: string[];
  /** From 0 to 2: how far and how fast it moves. Colors never change with it. Defaults to 1. */
  expressivity?: number;
  /**
   * What screen readers read as the value for each state, for example to translate them. Defaults
   * to "Ready", "Connecting", "Listening", "Thinking" and "Speaking". The label, "Voice agent", is
   * `accessibilityLabel`.
   */
  stateLabels?: Partial<Record<VoiceAgentState, string>>;
};

/** A color as hue (a fraction of a turn), saturation and value, each from 0 to 1. */
export type Hsv = { hue: number; saturation: number; value: number };
