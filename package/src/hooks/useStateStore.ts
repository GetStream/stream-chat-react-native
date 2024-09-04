import { useEffect, useState } from 'react';

import type { StateStore } from 'stream-chat';

export function useStateStore<T extends Record<string, unknown>, O extends readonly unknown[]>(
  store: StateStore<T>,
  selector: (v: T) => O,
): O;
export function useStateStore<T extends Record<string, unknown>, O extends readonly unknown[]>(
  store: StateStore<T> | undefined,
  selector: (v: T) => O,
): O | undefined;
export function useStateStore<T extends Record<string, unknown>, O extends readonly unknown[]>(
  store: StateStore<T> | undefined,
  selector: (v: T) => O,
) {
  const [state, setState] = useState<O | undefined>(() => {
    if (!store) return undefined;
    return selector(store.getLatestValue());
  });

  useEffect(() => {
    if (!store) return;

    const unsubscribe = store.subscribeWithSelector(selector, setState);

    return unsubscribe;
  }, [store, selector]);

  return state;
}
