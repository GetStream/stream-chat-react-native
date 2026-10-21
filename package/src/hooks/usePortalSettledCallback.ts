import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useStableCallback } from './useStableCallback';

/** Frames to wait after the overlay closes before running focus-sensitive work (iOS needs none). */
const SETTLE_FRAMES = Platform.OS === 'android' ? 2 : 0;

/** Runs `callback` after `frames` animation frames, collecting the RAF IDs in `rafIds`. */
const scheduleAfterFrames = (callback: () => void, frames: number, rafIds: number[]) => {
  if (frames <= 0) {
    callback();
    return;
  }

  const rafId = requestAnimationFrame(() => scheduleAfterFrames(callback, frames - 1, rafIds));
  rafIds.push(rafId);
};

/**
 * Returns a stable callback that runs once a `PortalWhileClosingView` has settled back into its
 * original tree.
 *
 * While a view returns from a portal host to its in-place host, follow-up work can target a node
 * that is about to be reattached. On Android, focus work loses focus again mid keyboard animation
 * (focusing the input right after the message overlay closes dismisses the keyboard at once), and
 * a pressed button that morphs can render into the wrong part of the hierarchy. The callback waits
 * two frames on Android, the first for the portal to retarget and React to commit, the second for
 * the native hierarchy to settle. On iOS it runs immediately.
 *
 * @param callback Runs once the portal handoff has settled.
 * @returns A stable callback gated behind the settle window.
 */
export const usePortalSettledCallback = <T extends unknown[]>(callback: (...args: T) => void) => {
  const rafIdsRef = useRef<number[]>([]);
  // Runs from deferred RAF work, so it must read the latest callback across re-renders.
  const stableCallback = useStableCallback(callback);

  const clearScheduledFrames = useStableCallback(() => {
    rafIdsRef.current.forEach((rafId) => cancelAnimationFrame(rafId));
    rafIdsRef.current = [];
  });

  useEffect(() => clearScheduledFrames, [clearScheduledFrames]);

  return useStableCallback((...args: T) => {
    clearScheduledFrames();
    scheduleAfterFrames(() => stableCallback(...args), SETTLE_FRAMES, rafIdsRef.current);
  });
};
