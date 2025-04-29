import { useCallback, useMemo } from 'react';

import type { Channel as ChannelType } from 'stream-chat';

import { useChannelsStateContext } from './ChannelsStateContext';

import type { ChannelsStateContextValue, ChannelState, Keys } from './ChannelsStateContext';

type StateManagerParams<Key extends Keys> = ChannelsStateContextValue & {
  cid: string;
  key: Key;
};

/*
  This hook takes care of creating a useState-like interface which can be used later to call
  updates to the ChannelsStateContext reducer. It receives the cid and key which it wants to update
  and perform the state updates. Also supports a initialState.
*/
export function useStateManager<Key extends Keys>(
  { cid, key, setState, state }: StateManagerParams<Key>,
  initialValue?: ChannelState[Key],
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedInitialValue = useMemo(() => initialValue, []);
  const value = state[cid]?.[key] || (memoizedInitialValue as ChannelState[Key]);

  const setValue = useCallback(
    (value: ChannelState[Key]) => setState({ cid, key, value }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cid, key],
  );

  return [value, setValue] as const;
}

export type UseChannelStateValue = {
  setThreadMessages: (value: ChannelState['threadMessages']) => void;
  threadMessages: ChannelState['threadMessages'];
};

export function useChannelState(
  channel: ChannelType | undefined,
  threadId?: string,
): UseChannelStateValue {
  const cid = channel?.id || 'id'; // in case channel is not initialized, use generic id string for indexing
  const { setState, state } = useChannelsStateContext();

  const [threadMessages, setThreadMessagesInternal] = useStateManager(
    {
      cid,
      key: 'threadMessages',
      setState,
      state,
    },
    (threadId && channel?.state?.threads?.[threadId]) || [],
  );
  const setThreadMessages = useCallback(
    (value: ChannelState['threadMessages']) => setThreadMessagesInternal([...value]),
    [setThreadMessagesInternal],
  );

  return {
    setThreadMessages,
    threadMessages,
  };
}
