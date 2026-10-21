import { useEffect, useRef, useState } from 'react';

/**
 * Coalesces a fast-changing value to at most one update per animation frame, so sources that fire
 * several times within a paint (selectors, sockets, DB listeners) cause one render, not many.
 *
 * Intermediate values within a frame are skipped, so it suits visual coalescing, not logic that
 * must observe every transition. Equality is referential: a producer that recreates arrays or
 * objects still publishes once per frame, so stabilize them upstream. It follows the frame cadence
 * and is not a throttle or debounce. A pending frame is cancelled only on unmount, not on value
 * changes.
 *
 * @param value The upstream value that may change several times within a frame.
 * @param isEnabled When false, `value` is returned as is with the same reference, to gate the RAF
 * behind a feature flag.
 * @returns The latest value, updated at most once per frame.
 */
export const useRAFCoalescedValue = <S>(value: S, isEnabled: boolean | undefined): S => {
  const [emitted, setEmitted] = useState<S>(value);
  const pendingRef = useRef<S>(value);
  const rafIdRef = useRef<number | null>(null);

  // If `value` changes, schedule a single RAF to publish the latest one.
  useEffect(() => {
    if (value === pendingRef.current || !isEnabled) return;
    pendingRef.current = value;

    // A frame is already scheduled.
    if (rafIdRef.current) return;

    const run = () => {
      rafIdRef.current = null;
      setEmitted(pendingRef.current);
    };

    rafIdRef.current = requestAnimationFrame(run);
  }, [value, isEnabled]);

  useEffect(() => {
    return () => {
      // Cancel a pending frame on unmount.
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return isEnabled ? emitted : value;
};
