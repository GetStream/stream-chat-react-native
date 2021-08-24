import { useCallback, useEffect, useMemo } from 'react';
import type { Channel as ChannelType } from 'stream-chat';

import { useChannelsStateContext } from './ChannelsStateContext';

import type { ChannelsStateContextValue, ChannelState, Keys } from './ChannelsStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

type StateManagerParams<
  Key extends Keys,
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Omit<
  ChannelsStateContextValue<At, Ch, Co, Ev, Me, Re, Us>,
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  {
    cid,
    key,
    setState,
    state,
  }: Omit<
    StateManagerParams<Key, At, Ch, Co, Ev, Me, Re, Us>,
    'increaseSubscriberCount' | 'decreaseSubscriberCount'
  >,
  initialValue?: ChannelState<At, Ch, Co, Ev, Me, Re, Us>[Key],
) {
  const memoizedInitialValue = useMemo(() => initialValue, []);
  const value =
    state[cid]?.[key] || (memoizedInitialValue as ChannelState<At, Ch, Co, Ev, Me, Re, Us>[Key]);

  const setValue = useCallback(
    (value: ChannelState<At, Ch, Co, Ev, Me, Re, Us>[Key]) => setState({ cid, key, value }),
    [cid, key],
  );

  return [value, setValue] as const;
}

export type UseChannelStateValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = {
  members: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['members'];
  messages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messages'];
  read: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['read'];
  setMembers: (value: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['members']) => void;
  setMessages: (value: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messages']) => void;
  setRead: (value: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['read']) => void;
  setThreadMessages: (value: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['threadMessages']) => void;
  setTyping: (value: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['typing']) => void;
  setWatcherCount: (value: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['watcherCount']) => void;
  setWatchers: (value: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['watchers']) => void;
  threadMessages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['threadMessages'];
  typing: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['typing'];
  watcherCount: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['watcherCount'];
  watchers: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['watchers'];
};

export function useChannelState<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  channel: ChannelType<At, Ch, Co, Ev, Me, Re, Us> | undefined,
  threadId?: string,
): UseChannelStateValue<At, Ch, Co, Ev, Me, Re, Us> {
  const cid = channel?.id || 'id'; // in case channel is not initialized, use generic id string for indexing
  const { decreaseSubscriberCount, increaseSubscriberCount, setState, state } =
    useChannelsStateContext<At, Ch, Co, Ev, Me, Re, Us>();

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
