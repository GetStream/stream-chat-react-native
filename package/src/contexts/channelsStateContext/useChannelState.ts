import { useCallback, useMemo } from 'react';

import type { Channel as ChannelType } from 'stream-chat';

import { useChannelsStateContext } from './ChannelsStateContext';

import type { ChannelsStateContextValue, ChannelState, Keys } from './ChannelsStateContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

type StateManagerParams<
  Key extends Keys,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = ChannelsStateContextValue<StreamChatGenerics> & {
  cid: string;
  key: Key;
};

/*
  This hook takes care of creating a useState-like interface which can be used later to call
  updates to the ChannelsStateContext reducer. It receives the cid and key which it wants to update
  and perform the state updates. Also supports a initialState.
*/
export function useStateManager<
  Key extends Keys,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  { cid, key, setState, state }: StateManagerParams<Key, StreamChatGenerics>,
  initialValue?: ChannelState<StreamChatGenerics>[Key],
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedInitialValue = useMemo(() => initialValue, []);
  const value =
    state[cid]?.[key] || (memoizedInitialValue as ChannelState<StreamChatGenerics>[Key]);

  const setValue = useCallback(
    (value: ChannelState<StreamChatGenerics>[Key]) => setState({ cid, key, value }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cid, key],
  );

  return [value, setValue] as const;
}

export type UseChannelStateValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  setThreadMessages: (value: ChannelState<StreamChatGenerics>['threadMessages']) => void;
  threadMessages: ChannelState<StreamChatGenerics>['threadMessages'];
};

export function useChannelState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: ChannelType<StreamChatGenerics> | undefined,
  threadId?: string,
): UseChannelStateValue<StreamChatGenerics> {
  const cid = channel?.id || 'id'; // in case channel is not initialized, use generic id string for indexing
  const { setState, state } = useChannelsStateContext<StreamChatGenerics>();

  const [threadMessages, setThreadMessages] = useStateManager(
    {
      cid,
      key: 'threadMessages',
      setState,
      state,
    },
    (threadId && channel?.state?.threads?.[threadId]) || [],
  );

  return {
    setThreadMessages,
    threadMessages,
  };
}
