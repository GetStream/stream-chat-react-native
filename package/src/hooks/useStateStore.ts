import { useCallback, useMemo } from 'react';

import type { StateStore } from 'stream-chat';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

const noop = () => {};

export function useStateStore<
  T extends Record<string, unknown>,
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>,
>(store: StateStore<T>, selector: (v: T) => O): O;
export function useStateStore<
  T extends Record<string, unknown>,
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>,
>(store: StateStore<T> | undefined, selector: (v: T) => O): O | undefined;
export function useStateStore<
  T extends Record<string, unknown>,
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>,
>(store: StateStore<T> | undefined, selector: (v: T) => O) {
  const wrappedSubscription = useCallback(
    (onStoreChange: () => void) => {
      const unsubscribe = store?.subscribeWithSelector(selector, onStoreChange);
      return unsubscribe ?? noop;
    },
    [store, selector],
  );

  const wrappedSnapshot = useMemo(() => {
    let cachedTuple: [T, O];

    return () => {
      const currentValue = store?.getLatestValue();

      if (!currentValue) return undefined;

      // store value hasn't changed, no need to compare individual values
      if (cachedTuple && cachedTuple[0] === currentValue) {
        return cachedTuple[1];
      }

      const newlySelected = selector(currentValue);

      // store value changed but selected values wouldn't have to, double-check selected
      if (cachedTuple) {
        let selectededAreEqualToCached = true;

        for (const key in cachedTuple[1]) {
          if (cachedTuple[1][key] === newlySelected[key]) continue;
          selectededAreEqualToCached = false;
          break;
        }

        if (selectededAreEqualToCached) return cachedTuple[1];
      }

      cachedTuple = [currentValue, newlySelected];
      return cachedTuple[1];
    };
  }, [store, selector]);

  const state = useSyncExternalStore(wrappedSubscription, wrappedSnapshot);

  return state;
}
