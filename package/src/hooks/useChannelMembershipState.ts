import { Channel, ChannelMemberResponse } from 'stream-chat';

import { useStateStore } from './useStateStore';

const selector = (state: { membership: ChannelMemberResponse }) => ({
  membership: state.membership,
});

/**
 * Returns the current user's membership for the channel, sourced reactively from `channel.state`
 * (updates on `member.added`/`member.updated`).
 */
export function useChannelMembershipState(channel: Channel): ChannelMemberResponse;
export function useChannelMembershipState(channel?: Channel): ChannelMemberResponse | undefined;
export function useChannelMembershipState(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.membership;
}
