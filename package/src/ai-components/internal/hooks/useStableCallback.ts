import { useCallback, useRef } from 'react';

export type StableCallback<A extends unknown[], R> = (...args: A) => R;

/**
 * Returns a function with a stable identity that always calls the latest `callback`, so it is safe
 * as a hook dependency without stale closures.
 *
 * Do not wrap functions that return elements (such as a list render function): React cannot tell
 * when their output should change. Prefer a plain `useCallback` where it suffices.
 *
 * @param callback The function to stabilize.
 * @returns The stable function, returning whatever `callback` returns.
 */
export const useStableCallback = <A extends unknown[], R>(
  callback: StableCallback<A, R>,
): StableCallback<A, R> => {
  const ref = useRef(callback);
  ref.current = callback;

  return useCallback<StableCallback<A, R>>((...args) => {
    return ref.current(...args);
  }, []);
};
