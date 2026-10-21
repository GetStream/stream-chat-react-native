import { type RefObject, useCallback, useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle } from 'react-native';

import { useScreenReaderEnabled } from './useScreenReaderEnabled';

type FindNodeHandleArg = Parameters<typeof findNodeHandle>[0];

/** A ref (its `.current` is read at call time), a native node handle, or nothing. */
export type AccessibilityFocusTarget = RefObject<unknown> | number | null | undefined;

const resolveNode = (target: AccessibilityFocusTarget): number | null => {
  if (target == null) {
    return null;
  }
  if (typeof target === 'number') {
    return target;
  }
  const current = target.current;
  return current == null ? null : (findNodeHandle(current as FindNodeHandleArg) ?? null);
};

/**
 * Returns a stable callback that moves the screen reader cursor onto a target on the next frame.
 * It only moves accessibility focus: it opens no keyboard and does not activate the target.
 * Does nothing unless a screen reader is running (see {@link useScreenReaderEnabled}).
 *
 * Focus set on mount only sticks on Android forward navigation. On iOS forward navigation and on
 * back navigation, set it after the screen transition completes (React Navigation's
 * `transitionEnd`); {@link useScreenReaderMountFocus} covers the mount case.
 *
 * @returns A callback taking the {@link AccessibilityFocusTarget} to focus.
 */
export const useSetAccessibilityFocus = () => {
  const screenReaderEnabled = useScreenReaderEnabled();
  // A ref keeps the returned callback referentially stable while reading the latest value.
  const screenReaderEnabledRef = useRef(screenReaderEnabled);
  screenReaderEnabledRef.current = screenReaderEnabled;

  const rafRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    },
    [],
  );

  return useCallback((target: AccessibilityFocusTarget) => {
    if (!screenReaderEnabledRef.current) {
      return;
    }
    const node = resolveNode(target);
    if (node == null) {
      return;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }
    // Defer a frame so the target has laid out before the cursor moves onto it.
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      AccessibilityInfo.setAccessibilityFocus(node);
    });
  }, []);
};
