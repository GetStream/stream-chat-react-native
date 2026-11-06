import { useMemo } from 'react';

import { Channel, TypingUsersState } from 'stream-chat';

import { useChannelContext, useChatContext, useThreadContext } from '../../../contexts';
import { useStateStore } from '../../../hooks';
import { filterTypingUsers } from '../utils/filterTypingUsers';

const selector = (state: TypingUsersState) => ({ typing: state.typing });

/**
 * The users typing in `channel`, without the current user, from `channel.state.typing`.
 * With `threadId` only that thread's typing counts; without it, only the channel's own.
 *
 * The channel is a parameter rather than read from context, so this works outside a `<Channel>`
 * provider, such as in channel preview rows.
 *
 * @param channel The channel to watch.
 * @param threadId The thread to watch instead of the channel's main list.
 * @returns The typing users.
 */
export const useChannelTypingUsers = (channel: Channel, threadId?: string) => {
  const { client } = useChatContext();
  const { typing } = useStateStore(channel.state, selector) ?? { typing: {} };

  return useMemo(() => filterTypingUsers({ client, threadId, typing }), [client, threadId, typing]);
};

/**
 * {@link useChannelTypingUsers} for the channel, and open thread if any, from context.
 *
 * @returns The typing users.
 */
export const useTypingUsers = () => {
  const { channel } = useChannelContext();
  const { thread } = useThreadContext();

  return useChannelTypingUsers(channel, thread?.id);
};
