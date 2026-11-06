import { useCallback, useRef } from 'react';

export type StableCallback<A extends unknown[], R> = (...args: A) => R;

/**
 * Returns a function with a stable reference that always calls the latest `callback` and returns
 * its result. It can be a dependency of other hooks without invalidating them on every parent
 * render.
 *
 * Do not wrap a function that returns elements (such as FlatList's `renderItem`): React would not
 * see an update when the callback changes. Prefer a plain `useCallback` where it works; this
 * bridges top-level contexts and cascading re-renders in downstream components and is not an
 * escape hatch.
 *
 * @param callback The callback to stabilize.
 * @returns The stable callback.
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
