import { type Dispatch, type SetStateAction, useCallback, useContext, useState } from 'react';

import { A2UIReplyContext } from './A2UIContexts';

const resolve = <T>(initial: T | (() => T)) =>
  typeof initial === 'function' ? (initial as () => T)() : initial;

/** `useState` for a part's own state, which starts again from `initial` for another reply. */
export const useReplyState = <T>(initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] => {
  const messageId = useContext(A2UIReplyContext)?.messageId;
  const [held, setHeld] = useState(() => ({ messageId, value: resolve(initial) }));
  let { value } = held;
  if (held.messageId !== messageId) {
    value = resolve(initial);
    setHeld({ messageId, value });
  }
  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (next) =>
      setHeld((current) => ({
        ...current,
        value: typeof next === 'function' ? (next as (value: T) => T)(current.value) : next,
      })),
    [],
  );
  return [value, setValue];
};
