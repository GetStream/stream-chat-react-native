import { useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import {
  type FrameInfo,
  runOnUI,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  advanceDriver,
  createDriverState,
  hoverDriver,
  tapDriver,
  type VoiceDriverInput,
} from './driver';
import { audioLevelInput, expressivityInput } from './math';
import { FALLBACK_COLOR, luminance, toHsvPalette } from './palette';
import type { VoiceVisualizationStyle } from './styles';
import type { VoiceVisualizationProps } from './types';
import { useReduceMotion } from './useReduceMotion';

import { useTheme } from '../contexts';

/** How long the visualization takes to fade in once its first frame is drawn, as on iOS. */
const FADE_IN_MS = 300;

/** Whether to draw for a dark background: the theme's backdrop when readable, else the scheme. */
const useDark = (backdropColor: string | undefined) => {
  const scheme = useColorScheme();
  return useMemo(() => {
    const backdrop = backdropColor ? luminance(backdropColor) : null;
    if (backdrop !== null) return backdrop < 0.5 ? 1 : 0;
    return scheme === 'dark' ? 1 : 0;
  }, [backdropColor, scheme]);
};

/**
 * A voice visualization's motion, advanced once a frame on the UI thread.
 *
 * The driver lives in a shared value the renderers derive from, so a frame redraws without
 * re-rendering React, and `audioLevel` is read in the frame callback, so a level changing many
 * times a second re-renders nothing either.
 */
export const useVoiceVisualization = (
  { audioLevel, colors, expressivity, state }: VoiceVisualizationProps,
  style: VoiceVisualizationStyle,
) => {
  const { theme } = useTheme();
  const reduceMotion = useReduceMotion();
  const themeColors = theme.voiceVisualization?.colors;
  const dark = useDark(theme.voiceVisualization?.backdropColor);

  const colorsKey = (colors ?? []).join('|');
  const themeKey = (themeColors ?? []).join('|');
  const palette = useMemo(() => {
    const own = toHsvPalette(colors ?? []);
    if (own.length) return own;
    const fromTheme = toHsvPalette(themeColors ?? []);
    return fromTheme.length ? fromTheme : toHsvPalette([FALLBACK_COLOR]);
    // Keyed by the colors themselves, so a new array of the same colors changes nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorsKey, themeKey]);

  const input: VoiceDriverInput = {
    audioLevel: null,
    colors: palette,
    expressivity: expressivityInput(expressivity),
    reduceMotion,
    state,
  };

  // Starts settled on the first input, so the first frame shows it rather than easing into it.
  const [initialDriver] = useState(() =>
    createDriverState(
      { ...input, audioLevel: audioLevelInput(audioLevel?.value) },
      style.levelResponse,
    ),
  );
  const driver = useSharedValue(initialDriver);
  const inputValue = useSharedValue(input);
  const darkValue = useSharedValue(dark);
  const opacity = useSharedValue(0);

  useEffect(() => {
    inputValue.value = {
      audioLevel: null,
      colors: palette,
      expressivity: expressivityInput(expressivity),
      reduceMotion,
      state,
    };
  }, [expressivity, inputValue, palette, reduceMotion, state]);

  useEffect(() => {
    darkValue.value = dark;
  }, [dark, darkValue]);

  const onFrame = useCallback(
    (frame: FrameInfo) => {
      'worklet';
      const seconds = (frame.timeSincePreviousFrame ?? 0) / 1000;
      const current = inputValue.value;
      const level = audioLevelInput(audioLevel ? audioLevel.value : null);
      const next = level === current.audioLevel ? current : { ...current, audioLevel: level };
      driver.modify((d) => {
        'worklet';
        advanceDriver(d, next, seconds);
        return d;
      });
      // It fades in once it has something to show, rather than flashing empty while the first
      // frame lands.
      if (opacity.value === 0) opacity.value = withTiming(1, { duration: FADE_IN_MS });
    },
    [audioLevel, driver, inputValue, opacity],
  );
  useFrameCallback(onFrame);

  /** A tap at a point centred and normalized to the shorter side, y up. */
  const tap = useCallback(
    (x: number, y: number) => {
      runOnUI((tapX: number, tapY: number) => {
        'worklet';
        driver.modify((d) => {
          'worklet';
          tapDriver(d, inputValue.value, tapX, tapY);
          return d;
        });
      })(x, y);
    },
    [driver, inputValue],
  );

  /** Where a pointer hovers, or null once it has left. */
  const hover = useCallback(
    (x: number | null, y: number | null) => {
      runOnUI((hoverX: number | null, hoverY: number | null) => {
        'worklet';
        driver.modify((d) => {
          'worklet';
          hoverDriver(d, inputValue.value, hoverX, hoverY);
          return d;
        });
      })(x, y);
    },
    [driver, inputValue],
  );

  return { dark: darkValue, driver, hover, opacity, tap };
};

export type VoiceVisualization = ReturnType<typeof useVoiceVisualization>;
