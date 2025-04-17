import { useCallback, useRef } from 'react';

export type StableCallback<A extends unknown[], R> = (...args: A) => R;

export const useStableCallback = <A extends unknown[], R>(
  callback: StableCallback<A, R>,
): StableCallback<A, R> => {
  const ref = useRef(callback);
  ref.current = callback;

  return useCallback<StableCallback<A, R>>((...args) => {
    return ref.current(...args);
  }, []);
};
