import type { Channel } from 'stream-chat';

import { useChannelContext } from '../contexts/channelContext/ChannelContext';
import { useThreadContext } from '../contexts/threadContext/ThreadContext';

/**
 * Resolves the active channel: the thread's channel inside a `<Thread>`, otherwise the
 * `ChannelContext` channel. Prefer it over `useChannelContext()` in code shared between the main
 * list and a thread.
 *
 * @returns The active channel.
 */
export const useChannel = (): Channel => {
  const { channel } = useChannelContext();
  const { thread } = useThreadContext();

  return thread?.channel ?? channel;
};
