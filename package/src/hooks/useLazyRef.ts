import { type MutableRefObject, useRef } from 'react';

export const useLazyRef = <T>(getInitialValue: () => T) => {
  const ref = useRef<T | null>(null);

  if (ref.current === null) {
    ref.current = getInitialValue();
  }

  return ref as MutableRefObject<T>;
};
