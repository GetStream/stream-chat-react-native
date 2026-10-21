import { Channel } from 'stream-chat';

import { useStateStore } from './useStateStore';

const selector = (state: { memberCount: number }) => ({
  memberCount: state.memberCount,
});

/**
 * Returns the channel's member count, read reactively from `channel.state` (updates on
 * `channel.updated`).
 *
 * @param channel The channel to read from.
 * @returns The member count.
 */
export function useChannelMemberCount(channel: Channel): number;
/** Same as above, for a channel that may be undefined. */
export function useChannelMemberCount(channel?: Channel): number | undefined;
export function useChannelMemberCount(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.memberCount;
}
