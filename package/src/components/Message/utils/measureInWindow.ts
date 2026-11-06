import React from 'react';
import { Dimensions, Platform } from 'react-native';

import { EdgeInsets } from 'react-native-safe-area-context';

import type { ViewRef } from '../../../types/react-native-compat';

import { isRN86OrGreater } from '../../../utils/react-native-constants';

type MeasuredRect = { x: number; y: number; w: number; h: number };

/**
 * Top inset to add to a measured `y`. Android `measureInWindow` excludes the top inset below React
 * Native 0.86; from 0.86 the coordinates include it, and adding it again would shift every measured
 * view down by `insets.top`.
 */
const androidTopInsetCompensation = (insets: EdgeInsets): number =>
  Platform.OS === 'android' && !isRN86OrGreater ? insets.top : 0;

/**
 * Screen lengths from the origin beyond which a measured coordinate is treated as bogus. On-screen
 * targets measure within one screen and the failure is off by tens of screens, so 2 separates them.
 */
const SCREEN_BOUND_MULTIPLIER = 2;

/**
 * Whether a measured rect is unusable: non-finite values, a non-positive size, or coordinates more
 * than `SCREEN_BOUND_MULTIPLIER` screens from the origin. On Android, `measureInWindow` returns far
 * out of bounds coordinates when a library forces the window edge-to-edge (such as setting
 * `FLAG_LAYOUT_NO_LIMITS` for a transparent nav bar) while `edgeToEdgeEnabled` is off.
 *
 * @param x Measured x coordinate.
 * @param y Measured y coordinate.
 * @param w Measured width.
 * @param h Measured height.
 * @returns Whether the measurement should be discarded.
 */
export const isMeasuredRectBogus = (x: number, y: number, w: number, h: number): boolean => {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) {
    return true;
  }
  if (w <= 0 || h <= 0) {
    return true;
  }
  const { width, height } = Dimensions.get('screen');
  if (width <= 0 || height <= 0) {
    // Without a screen size there is nothing to compare against.
    return false;
  }
  return (
    Math.abs(x) > width * SCREEN_BOUND_MULTIPLIER || Math.abs(y) > height * SCREEN_BOUND_MULTIPLIER
  );
};

export const measureInWindow = (
  node: React.RefObject<ViewRef | null>,
  insets: EdgeInsets,
): Promise<MeasuredRect> => {
  return new Promise((resolve, reject) => {
    const handle = node.current;
    if (!handle) {
      return reject(
        new Error('The native handle could not be found while invoking measureInWindow.'),
      );
    }

    handle.measureInWindow((x, y, w, h) => {
      if (!isMeasuredRectBogus(x, y, w, h)) {
        resolve({ h, w, x, y: y + androidTopInsetCompensation(insets) });
        return;
      }

      // Falls back to `measure()` for a bogus rect: its `pageX`/`pageY` are relative to the app
      // root, the same space as the window, and stay correct when the window frame was mutated
      // behind React Native's back.
      if (typeof handle.measure !== 'function') {
        resolve({ h, w, x, y: y + androidTopInsetCompensation(insets) });
        return;
      }

      handle.measure((_x, _y, width, height, pageX, pageY) => {
        resolve({ h: height, w: width, x: pageX, y: pageY });
      });
    });
  });
};
