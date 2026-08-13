import { Channel } from 'stream-chat';

import { useStateStore } from './useStateStore';

const selector = (state: { memberCount: number }) => ({
  memberCount: state.memberCount,
});

/**
 * Returns the channel's member count, sourced reactively from `channel.state` (updates on
 * `channel.updated`).
 */
export function useChannelMemberCount(channel: Channel): number;
export function useChannelMemberCount(channel?: Channel): number | undefined;
export function useChannelMemberCount(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.memberCount;
}
