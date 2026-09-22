import { useChannelContext } from '../contexts/channelContext/ChannelContext';
import { useThreadContext } from '../contexts/threadContext/ThreadContext';

/**
 * The message paginator this subtree is rendering: the open thread's reply list when `threadList` is
 * set, the channel's main list otherwise.
 *
 * One place, because the SDK previously answered this question four times in three mutually
 * inconsistent ways — `threadList ? … : …`, `threadInstance ?? channel`, and `if (thread)`. Those
 * only agree while no one passes `thread` without `threadList`, which `ChannelProps` allows.
 * `threadList` is the rule: it states which list this subtree renders, which is the actual question.
 */
export const useActiveMessagePaginator = () => {
  const { channel, threadList } = useChannelContext();
  const { threadInstance } = useThreadContext();

  return threadList ? threadInstance?.messagePaginator : channel.messagePaginator;
};
