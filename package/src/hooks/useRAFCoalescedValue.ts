import { useEffect, useRef, useState } from 'react';

/**
 * A utility hook that coalesces a fast changing value to the display’s frame rate.
 * It accepts any “noisy” input (arrays, objects, numbers, etc.) and exposes a value
 * that React consumers will see at most once per animation frame (via
 * `requestAnimationFrame`). This is useful when upstream sources (selectors, sockets,
 * DB listeners) can fire multiple times within a single paint and you want to avoid
 * extra renders and layout churn.
 *
 * How it works:
 * - Keeps track of the latest incoming value
 * - Ensures there is **at most one** pending RAF at a time
 * - When the RAF fires, commits the **latest** value to state (`emitted`)
 * - If additional changes arrive before the RAF runs, they are merged (the last write
 *   operation wins) and no new RAF is scheduled
 *
 * With this hook you can:
 * - Feed a `FlatList`/`SectionList` from fast changing sources without spamming re-renders
 * - Align React updates to the paint cadence (one publish per frame)
 * - Help preserve item anchoring logic (e.g., MVCP) by reducing in-frame updates
 *
 * **Caveats:**
 * - This hook intentionally skips intermediate states that occur within the same
 *   frame. If you must observe every transition (e.g., for analytics/reducers), do that
 *   upstream; this hook is for visual coalescing
 * - Equality checks are simple referential equalities. If your producer recreates arrays
 *   or objects each time, you’ll still publish once per frame. To avoid even those
 *   emissions, stabilize upstream
 * - This is not a silver bullet for throttle/debounce; it uses the screen’s refresh cycle;
 *   If you need “no more than once per X ms”, layer that upstream
 *
 * Usage tips:
 * - Prefer passing already-memoized values when possible (e.g., stable arrays by ID).
 * - Pair with a stable `keyExtractor` in lists so coalesced updates map cleanly to rows.
 * - Do not cancel/reschedule on prop changes; cancellation is handled on unmount only.
 *
 * @param value The upstream value that may change multiple times within a single frame.
 * @returns A value that updates **at most once per frame** with the latest input.
 */
export const useRAFCoalescedValue = <S>(value: S): S => {
  const [emitted, setEmitted] = useState<S>(value);
  const pendingRef = useRef<S>(value);
  const rafIdRef = useRef<number | null>(null);

  // If `value` changes, schedule a single RAF to publish the latest one.
  useEffect(() => {
    if (value === pendingRef.current) return;
    pendingRef.current = value;

    // already scheduled the next frame, skip
    if (rafIdRef.current) return;

    const run = () => {
      rafIdRef.current = null;
      setEmitted(pendingRef.current);
    };

    rafIdRef.current = requestAnimationFrame(run);
  }, [value]);

  useEffect(() => {
    return () => {
      // cancel the frame if it exists only on unmount
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return emitted;
};
