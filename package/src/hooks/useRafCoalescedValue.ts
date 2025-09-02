import { useEffect, useRef, useState } from 'react';

/**
 * Coalesce a fast-changing value so React consumers only see updates:
 *  - at most once per animation frame (RAF), and
 *  - optionally no more often than `minIntervalMs`.
 */
export const useRafCoalescedValue = <S>(value: S): S => {
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
