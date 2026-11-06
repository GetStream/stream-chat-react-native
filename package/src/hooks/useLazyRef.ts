import { type RefObject, useRef } from 'react';

/**
 * Creates a stable ref whose initial value is computed once, for values that are costly to build.
 *
 * @param getInitialValue Computes the initial value on the first render. Must not return `null`.
 * @returns The ref holding the value.
 */
export const useLazyRef = <T>(getInitialValue: () => T) => {
  const ref = useRef<T | null>(null);

  if (ref.current === null) {
    ref.current = getInitialValue();
  }

  return ref as RefObject<T>;
};
