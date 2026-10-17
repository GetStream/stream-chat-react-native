import { useChannelContext } from '../contexts/channelContext/ChannelContext';
import { useThreadContext } from '../contexts/threadContext/ThreadContext';

/**
 * The message paginator this subtree is rendering: the thread's reply list inside a `<Thread>`, the
 * channel's main list otherwise.
 */
export const useMessagePaginator = () => {
  const { channel } = useChannelContext();
  const { thread } = useThreadContext();

  return thread ? thread.messagePaginator : channel.messagePaginator;
};
