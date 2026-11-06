import { Channel, ChannelMemberResponse } from 'stream-chat';

import { useStateStore } from './useStateStore';

const selector = (state: { membership: ChannelMemberResponse }) => ({
  membership: state.membership,
});

/**
 * Returns the current user's membership for the channel, read reactively from `channel.state`
 * (updates on `member.added`/`member.updated`).
 *
 * @param channel The channel to read from.
 * @returns The current user's membership.
 */
export function useChannelMembershipState(channel: Channel): ChannelMemberResponse;
/** Same as above, for a channel that may be undefined. */
export function useChannelMembershipState(channel?: Channel): ChannelMemberResponse | undefined;
export function useChannelMembershipState(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.membership;
}
