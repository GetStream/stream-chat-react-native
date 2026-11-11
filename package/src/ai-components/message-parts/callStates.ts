import { useMemo } from 'react';

import { StateStore } from '@stream-io/state-store';
import { useStateStore } from '@stream-io/state-store/react-bindings';

type CallStates = { calls: Readonly<Record<string, unknown>> };

// Where each call's question stands on this device, such as an answer on its way, kept apart from
// the views that show it: a list that reuses or remounts a row must neither hand a question's
// buttons back while its answer is on its way, nor show one call's state on another call.
const callStates = new StateStore<CallStates>({ calls: {} });

/** Where the question `key` names stands, or `initial` when nothing happened to it here. */
export const callStateOf = <T>(key: string, initial: T): T => {
  const { calls } = callStates.getLatestValue();
  return key in calls ? (calls[key] as T) : initial;
};

/** Sets where the question `key` names stands. `initial` forgets it. */
export const setCallState = <T>(key: string, next: T, initial: T) => {
  const { calls } = callStates.getLatestValue();
  if (next === initial) {
    if (!(key in calls)) return;
    const { [key]: _forgotten, ...rest } = calls;
    callStates.partialNext({ calls: rest });
  } else {
    callStates.partialNext({ calls: { ...calls, [key]: next } });
  }
};

/** Where the question `key` names stands, following it, whichever view shows it. */
export const useCallState = <T>(key: string, initial: T): T => {
  const selector = useMemo(
    () =>
      ({ calls }: CallStates) => ({
        state: (key in calls ? calls[key] : initial) as T,
      }),
    [initial, key],
  );
  return useStateStore(callStates, selector).state;
};

/** Forgets every question's state, for tests that reuse calls. */
export const forgetCallStates = () => callStates.next({ calls: {} });
