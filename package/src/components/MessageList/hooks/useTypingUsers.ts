import { useMemo } from 'react';

import { Channel, TypingUsersState } from 'stream-chat';

import { useChannelContext, useChatContext, useThreadContext } from '../../../contexts';
import { useStateStore } from '../../../hooks';
import { filterTypingUsers } from '../utils/filterTypingUsers';

const selector = (state: TypingUsersState) => ({ typing: state.typing });

/**
 * Shared typing-users core. Takes `channel` (and an optional `threadId`) EXPLICITLY so it works both
 * inside a `<Channel>` provider (the message list) and outside one (channel-list preview rows, which
 * receive `channel` as a prop) — it deliberately never reads the channel/thread from context itself.
 * `client` comes from the always-present root `ChatContext`. Sourced reactively from the
 * `channel.state.typing` slice; own typing and other-thread typing are filtered out.
 */
export const useChannelTypingUsers = (channel: Channel, threadId?: string) => {
  const { client } = useChatContext();
  const { typing } = useStateStore(channel.state, selector) ?? { typing: {} };

  return useMemo(() => filterTypingUsers({ client, threadId, typing }), [client, threadId, typing]);
};

/**
 * In-channel typing users — reads the channel/thread from context (message-list usage). Thin wrapper
 * over {@link useChannelTypingUsers}.
 */
export const useTypingUsers = () => {
  const { channel } = useChannelContext();
  const { threadInstance } = useThreadContext();

  return useChannelTypingUsers(channel, threadInstance?.id);
};
