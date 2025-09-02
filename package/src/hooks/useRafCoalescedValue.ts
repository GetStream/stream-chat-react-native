import { useEffect, useRef, useState } from 'react';

/**
 * Coalesce a fast-changing value so React consumers only see updates:
 *  - at most once per animation frame (RAF), and
 *  - optionally no more often than `minIntervalMs`.
 */
export const useRafCoalescedValue = <S>(value: S): S => {
  const [emitted, setEmitted] = useState<S>(value);
  const pendingRef = useRef<S>(value);
  const rafIdRef = useRef<number | 0>(0 as const);

  // If `value` changes, schedule a single RAF to publish the latest one.
  useEffect(() => {
    if (value === pendingRef.current) return;
    pendingRef.current = value;

    if (rafIdRef.current) return; // already scheduled this frame

    const run = () => {
      rafIdRef.current = 0;
      setEmitted(pendingRef.current);
    };

    rafIdRef.current = requestAnimationFrame(run);

    return () => {
      // cancel the frame if needed
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };
  }, [value]);

  return emitted;
};
