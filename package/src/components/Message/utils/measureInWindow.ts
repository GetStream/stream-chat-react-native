import React from 'react';
import { Dimensions, Platform } from 'react-native';

import { EdgeInsets } from 'react-native-safe-area-context';

import type { ViewRef } from '../../../types/react-native-compat';

import { isRN86OrGreater } from '../../../utils/react-native-constants';

type MeasuredRect = { x: number; y: number; w: number; h: number };

/**
 * On Android, `measureInWindow` historically did not account for the top inset, so we added it
 * ourselves. React Native 0.86 fixed this upstream as part of its edge-to-edge rework and now
 * returns topInset corrected window coordinates. On >= 0.86 adding it again double counts the
 * inset and offsets every measured view down by `insets.top`, so we only compensate on Android
 * running React Native below 0.86.
 */
const androidTopInsetCompensation = (insets: EdgeInsets): number =>
  Platform.OS === 'android' && !isRN86OrGreater ? insets.top : 0;

/**
 * How many screen lengths away from the origin a measured coordinate may fall before we treat it as
 * bogus. Real targets (a view currently on screen) always measure well within one screen and the failure
 * mode we guard against is off by tens of screens, so a generous multiplier cleanly separates the two
 * with no risk of false positives on legitimate values.
 */
const SCREEN_BOUND_MULTIPLIER = 2;

/**
 * `measureInWindow` can return wildly out of bounds coordinates on Android when the native window has
 * been forced edge-to-edge behind React Native's back (i.e a library setting `FLAG_LAYOUT_NO_LIMITS`,
 * as `react-native-system-navigation-bar` does for a transparent nav bar) while RN's own edge-to-edge
 * (`edgeToEdgeEnabled`) is off. In that state the window relative measurement is corrupted and would
 * return a position of the View far offscreen.
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
    // can't reason about bounds, trust the measurement
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

      // If `measureInWindow` returned an out of bounds rect, fallback to `measure()`, whose
      // `pageX`/`pageY` are relative to the app root and are the same coordinate space as the window.
      // They will stays correct when the window frame has been mutated out from under
      // React Native.
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
