import { type RefObject, useRef } from 'react';

/**
 * Creates a stable ref whose initial value is computed only once.
 * Use this when the initial ref value is expensive or allocates an object.
 */
export const useLazyRef = <T>(getInitialValue: () => T) => {
  const ref = useRef<T | null>(null);

  if (ref.current === null) {
    ref.current = getInitialValue();
  }

  return ref as RefObject<T>;
};
