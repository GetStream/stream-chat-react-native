import { useEffect, useState } from 'react';

import type { StateStore } from 'stream-chat';

export const useStateStore = <T extends Record<string, unknown>, O extends readonly unknown[]>(
  store: StateStore<T> | undefined,
  selector: (v: T) => O,
) => {
  const [state, setState] = useState<O | undefined>(() => {
    if (!store) return undefined;
    return selector(store.getLatestValue());
  });

  useEffect(() => {
    if (!store) return;

    return store.subscribeWithSelector(selector, setState);
  }, [store, selector]);

  return state;
};
