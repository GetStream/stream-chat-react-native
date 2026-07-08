import type { MessagePaginator } from 'stream-chat';

import { useChannelContext } from '../contexts/channelContext/ChannelContext';
import { useThreadContext } from '../contexts/threadContext/ThreadContext';

/**
 * Resolves the active `MessagePaginator` from `stream-chat`: the thread's paginator when
 * rendered inside a thread, otherwise the channel's main-list paginator.
 *
 * Must be called within a `<Channel />` subtree (and optionally a `<Thread />` subtree).
 */
export const useMessagePaginator = (): MessagePaginator => {
  const { channel } = useChannelContext();
  const { threadInstance } = useThreadContext();

  return threadInstance?.messagePaginator ?? channel.messagePaginator;
};
