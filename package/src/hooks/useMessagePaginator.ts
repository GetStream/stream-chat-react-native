import { useChannelContext } from '../contexts/channelContext/ChannelContext';
import { useThreadContext } from '../contexts/threadContext/ThreadContext';

/**
 * The message paginator this subtree renders: the thread's inside a `<Thread>`, otherwise the
 * channel's.
 *
 * @returns The active message paginator.
 */
export const useMessagePaginator = () => {
  const { channel } = useChannelContext();
  const { thread } = useThreadContext();

  return thread ? thread.messagePaginator : channel.messagePaginator;
};
