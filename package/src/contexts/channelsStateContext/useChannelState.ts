import { useCallback, useEffect, useMemo } from 'react';

import type { Channel as ChannelType } from 'stream-chat';

import { useChannelsStateContext } from './ChannelsStateContext';

import type { ChannelsStateContextValue, ChannelState, Keys } from './ChannelsStateContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

type StateManagerParams<
  Key extends Keys,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Omit<
  ChannelsStateContextValue<StreamChatGenerics>,
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  {
    cid,
    key,
    setState,
    state,
  }: Omit<
    StateManagerParams<Key, StreamChatGenerics>,
    'increaseSubscriberCount' | 'decreaseSubscriberCount'
  >,
  initialValue?: ChannelState<StreamChatGenerics>[Key],
) {
  const memoizedInitialValue = useMemo(() => initialValue, []);
  const value =
    state[cid]?.[key] || (memoizedInitialValue as ChannelState<StreamChatGenerics>[Key]);

  const setValue = useCallback(
    (value: ChannelState<StreamChatGenerics>[Key]) => setState({ cid, key, value }),
    [cid, key],
  );

  return [value, setValue] as const;
}

export type UseChannelStateValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  members: ChannelState<StreamChatGenerics>['members'];
  messages: ChannelState<StreamChatGenerics>['messages'];
  read: ChannelState<StreamChatGenerics>['read'];
  setMembers: (value: ChannelState<StreamChatGenerics>['members']) => void;
  setMessages: (value: ChannelState<StreamChatGenerics>['messages']) => void;
  setRead: (value: ChannelState<StreamChatGenerics>['read']) => void;
  setThreadMessages: (value: ChannelState<StreamChatGenerics>['threadMessages']) => void;
  setTyping: (value: ChannelState<StreamChatGenerics>['typing']) => void;
  setWatcherCount: (value: ChannelState<StreamChatGenerics>['watcherCount']) => void;
  setWatchers: (value: ChannelState<StreamChatGenerics>['watchers']) => void;
  threadMessages: ChannelState<StreamChatGenerics>['threadMessages'];
  typing: ChannelState<StreamChatGenerics>['typing'];
  watcherCount: ChannelState<StreamChatGenerics>['watcherCount'];
  watchers: ChannelState<StreamChatGenerics>['watchers'];
};

export function useChannelState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: ChannelType<StreamChatGenerics> | undefined,
  threadId?: string,
): UseChannelStateValue<StreamChatGenerics> {
  const cid = channel?.id || 'id'; // in case channel is not initialized, use generic id string for indexing
  const { decreaseSubscriberCount, increaseSubscriberCount, setState, state } =
    useChannelsStateContext<StreamChatGenerics>();

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
    channel?.state?.members || {},
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
    channel?.state?.read || {},
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
