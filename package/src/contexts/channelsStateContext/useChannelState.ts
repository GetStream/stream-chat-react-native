import { useCallback, useEffect, useMemo } from 'react';

import type { Channel as ChannelType, ExtendableGenerics } from 'stream-chat';

import { useChannelsStateContext } from './ChannelsStateContext';

import type { ChannelsStateContextValue, ChannelState, Keys } from './ChannelsStateContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

type StateManagerParams<
  Key extends Keys,
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Omit<
  ChannelsStateContextValue<StreamChatClient>,
  'increaseSubscriberCount' | 'decreaseSubscriberCount'
> & {
  cid: string;
  key: Key;
};

/* 
  This hook takes care of creating a useState-like interface which can be used later to call
  updates to the ChannelsStateContext reducer. It receives the cid and key which it wants to update
  and perform the state updates. Also supports a initialState.
*/
function useStateManager<
  Key extends Keys,
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  {
    cid,
    key,
    setState,
    state,
  }: Omit<
    StateManagerParams<Key, StreamChatClient>,
    'increaseSubscriberCount' | 'decreaseSubscriberCount'
  >,
  initialValue?: ChannelState<StreamChatClient>[Key],
) {
  const memoizedInitialValue = useMemo(() => initialValue, []);
  const value = state[cid]?.[key] || (memoizedInitialValue as ChannelState<StreamChatClient>[Key]);

  const setValue = useCallback(
    (value: ChannelState<StreamChatClient>[Key]) => setState({ cid, key, value }),
    [cid, key],
  );

  return [value, setValue] as const;
}

export type UseChannelStateValue<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = {
  members: ChannelState<StreamChatClient>['members'];
  messages: ChannelState<StreamChatClient>['messages'];
  read: ChannelState<StreamChatClient>['read'];
  setMembers: (value: ChannelState<StreamChatClient>['members']) => void;
  setMessages: (value: ChannelState<StreamChatClient>['messages']) => void;
  setRead: (value: ChannelState<StreamChatClient>['read']) => void;
  setThreadMessages: (value: ChannelState<StreamChatClient>['threadMessages']) => void;
  setTyping: (value: ChannelState<StreamChatClient>['typing']) => void;
  setWatcherCount: (value: ChannelState<StreamChatClient>['watcherCount']) => void;
  setWatchers: (value: ChannelState<StreamChatClient>['watchers']) => void;
  threadMessages: ChannelState<StreamChatClient>['threadMessages'];
  typing: ChannelState<StreamChatClient>['typing'];
  watcherCount: ChannelState<StreamChatClient>['watcherCount'];
  watchers: ChannelState<StreamChatClient>['watchers'];
};

export function useChannelState<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  channel: ChannelType<StreamChatClient> | undefined,
  threadId?: string,
): UseChannelStateValue<StreamChatClient> {
  const cid = channel?.id || 'id'; // in case channel is not initialized, use generic id string for indexing
  const { decreaseSubscriberCount, increaseSubscriberCount, setState, state } =
    useChannelsStateContext<StreamChatClient>();

  // Keeps track of how many Channel components are subscribed to this Channel state (Channel vs Thread concurrency)
  useEffect(() => {
    increaseSubscriberCount({ cid });
    return () => {
      decreaseSubscriberCount({ cid });
    };
  }, []);

  const [members, setMembers] = useStateManager(
    {
      cid,
      key: 'members',
      setState,
      state,
    },
    {},
  );

  const [messages, setMessages] = useStateManager(
    {
      cid,
      key: 'messages',
      setState,
      state,
    },
    channel?.state?.messages || [],
  );

  const [read, setRead] = useStateManager(
    {
      cid,
      key: 'read',
      setState,
      state,
    },
    {},
  );

  const [typing, setTyping] = useStateManager(
    {
      cid,
      key: 'typing',
      setState,
      state,
    },
    {},
  );

  const [watcherCount, setWatcherCount] = useStateManager({
    cid,
    key: 'watcherCount',
    setState,
    state,
  });

  const [watchers, setWatchers] = useStateManager(
    {
      cid,
      key: 'watchers',
      setState,
      state,
    },
    {},
  );

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
    members,
    messages,
    read,
    setMembers,
    setMessages,
    setRead,
    setThreadMessages,
    setTyping,
    setWatcherCount,
    setWatchers,
    threadMessages,
    typing,
    watcherCount,
    watchers,
  };
}
