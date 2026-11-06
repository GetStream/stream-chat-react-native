import type { Channel } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

const selector = (state: { watcherCount: number }) => ({ watcherCount: state.watcherCount });

/**
 * Returns the channel's online (watcher) count from `channel.state`, updating reactively.
 *
 * @param channel The channel.
 * @returns The watcher count.
 */
export function useChannelOnlineMemberCount(channel: Channel): number;
/**
 * Same as above for an optional channel, returning `undefined` without one.
 *
 * @param channel The channel.
 * @returns The watcher count, or `undefined` without a channel.
 */
export function useChannelOnlineMemberCount(channel?: Channel): number | undefined;
export function useChannelOnlineMemberCount(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.watcherCount;
}
