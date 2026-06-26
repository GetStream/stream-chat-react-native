import { type RefObject, useCallback, useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle } from 'react-native';

import { useScreenReaderEnabled } from './useScreenReaderEnabled';

type FindNodeHandleArg = Parameters<typeof findNodeHandle>[0];

/**
 * Something the screen reader cursor can be moved onto: a ref (whose `.current` is
 * read at call time), a raw native node handle, or nothing.
 */
export type AccessibilityFocusTarget = RefObject<unknown> | number | null | undefined;

const resolveNode = (target: AccessibilityFocusTarget): number | null => {
  if (target == null) {
    return null;
  }
  if (typeof target === 'number') {
    return target;
  }
  const current = target.current;
  return current == null ? null : findNodeHandle(current as FindNodeHandleArg);
};

/**
 * Returns a stable callback that moves the screen reader cursor onto a given
 * target (a ref or a raw node handle). It ONLY moves accessibility focus and it
 * does not activate the target: i.e no keyboard opens and no field becomes first
 * responder. The user still double taps to act on whatever is focused.
 *
 * The target's `.current` is read at call time, so this is safe to wire into a
 * deferred/event callback.
 *
 * Noop unless a screen reader is running. {@link useScreenReaderEnabled} returns
 * false whenever the SDK's accessibility config is disabled, so this costs nothing
 * for the default (a11y opted out) configuration.
 *
 * Note: Navigation timing is platform nuanced: Android forward navigation lands a focus
 * set on mount, whereas iOS forward navigation and back navigation on both
 * platforms need it set after the screen transition completes (React Navigation's
 * `transitionEnd`). {@link useScreenReaderMountFocus} covers the mount case; wire
 * `transitionEnd` yourself for the rest (the SampleApp's
 * `useScreenReaderComposerFocusEffect` is a reference implementation).
 */
export const useSetAccessibilityFocus = () => {
  const screenReaderEnabled = useScreenReaderEnabled();
  // Track the latest value so the returned callback can stay referentially stable
  // (it's typically wired into a focus effect and read much later).
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
    // Defer a frame so the target has laid out before we move the cursor onto it.
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      AccessibilityInfo.setAccessibilityFocus(node);
    });
  }, []);
};
