import { useCallback, useRef } from 'react';

export type StableCallback<A extends unknown[], R> = (...args: A) => R;

/**
 * A utility hook implementing a stable callback. It takes in an unstable method that
 * is supposed to be invoked somewhere deeper in the DOM tree without making it
 * change its reference every time the parent component rerenders. It will also return
 * the value of the callback if it does return one.
 * A common use-case would be having a function whose invocation depends on state
 * somewhere high up in the DOM tree and wanting to use the same function deeper
 * down, for example in a leaf node and simply using useCallback results in
 * cascading dependency hell. If we wrap it in useStableCallback, we would be able
 * to:
 * - Use the same function as a dependency of another hook (since it is stable)
 * - Still invoke it and get the latest state
 *
 * **Caveats:**
 * - Never wrap a function that is supposed to return a React.ReactElement in
 *   useStableCallback, since React will not know that the DOM needs to be updated
 *   whenever the callback value changes (for example, renderItem from FlatList must
 *   never be wrapped in this hook)
 * - Always prefer using a standard useCallback/stable function wherever possible
 *   (the purpose of useStableCallback is to bridge the gap between top level contexts
 *   and cascading rereders in downstream components - **not** as an escape hatch)
 * @param callback - the callback we want to stabilize
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
