import type { Channel } from 'stream-chat';

import { useChannelContext } from '../contexts/channelContext/ChannelContext';
import { useThreadContext } from '../contexts/threadContext/ThreadContext';

/**
 * Resolves the active `Channel` instance: the thread's channel when rendered inside a
 * thread, otherwise the `ChannelContext` channel.
 *
 * Thread-aware analogue of stream-chat-react's `useChannel()`. Prefer this over reading
 * `channel` from `useChannelContext()` directly in message/thread interaction code, so the
 * same code path targets the correct channel in both the main list and a thread.
 */
export const useChannel = (): Channel => {
  const { channel } = useChannelContext();
  const { threadInstance } = useThreadContext();

  return threadInstance?.channel ?? channel;
};
