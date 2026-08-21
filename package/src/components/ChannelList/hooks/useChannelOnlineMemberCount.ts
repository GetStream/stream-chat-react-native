import type { Channel } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

const selector = (state: { watcherCount: number }) => ({ watcherCount: state.watcherCount });

/**
 * Returns the channel's online (watcher) count, sourced reactively from
 * `channel.state`.
 */
export function useChannelOnlineMemberCount(channel: Channel): number;
export function useChannelOnlineMemberCount(channel?: Channel): number | undefined;
export function useChannelOnlineMemberCount(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.watcherCount;
}
