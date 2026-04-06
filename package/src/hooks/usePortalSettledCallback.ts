import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useStableCallback } from './useStableCallback';

/**
 * Number of frames we wait before invoking input focus sensitive work after the
 * overlay closes.
 */
const SETTLE_FRAMES = Platform.OS === 'android' ? 2 : 0;

/**
 * Runs a callback after a fixed number of animation frames.
 *
 * We use RAFs here because the settling work we care about is tied to the next
 * rendered frames after the overlay close transition.
 *
 * @param callback - callback to run once the frame budget has elapsed
 * @param frames - number of frames to wait
 * @param rafIds - accumulator used for later cancellation/cleanup
 */
const scheduleAfterFrames = (callback: () => void, frames: number, rafIds: number[]) => {
  if (frames <= 0) {
    callback();
    return;
  }

  const rafId = requestAnimationFrame(() => scheduleAfterFrames(callback, frames - 1, rafIds));
  rafIds.push(rafId);
};

/**
 * Returns a stable callback that is safe to run after a `PortalWhileClosingView`
 * has settled back into its original tree.
 *
 * Some followup actions are sensitive to that handoff window. If they run
 * while a view is still being returned from a portal host to its in place host,
 * they can target a node that is about to be reattached. On Android, that is
 * especially noticeable with focus sensitive work, where the target can lose
 * focus again mid keyboard animation.
 *
 * Two frames are intentional here:
 * - frame 1 lets the portal retarget and React commit the component tree
 * - frame 2 lets the native view hierarchy settle in its final host
 *
 * iOS does not currently need this settle window for this flow.
 *
 * A good example is the message composer edit action: after closing the message
 * overlay, we wait for the portal handoff to settle before focusing the input
 * and opening the keyboard. Doing this prematurely will result in the keyboard
 * being immediately closed.
 *
 * Another good example would be having a button wrapped in a `PortalWhileClosingView`,
 * that possibly renders (or morphs into) something when pressed. Handling `onPress`
 * prematurely here may lead to the morphed button rendering into a completely different
 * part of the UI hierarchy, causing unknown behaviour. This hook prevents that from
 * happening.
 *
 * @param callback - callback we want to invoke once the portal handoff has settled
 * @returns A stable callback gated behind the portal settle window.
 */
export const usePortalSettledCallback = <T extends unknown[]>(callback: (...args: T) => void) => {
  const rafIdsRef = useRef<number[]>([]);
  // This callback runs from deferred RAF work, so it must stay fresh across rerenders.
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
