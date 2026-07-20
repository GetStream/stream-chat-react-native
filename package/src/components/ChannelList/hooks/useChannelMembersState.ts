import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

const selector = (state: { members: Record<string, ChannelMemberResponse> }) => ({
  members: state.members,
});

/**
 * Returns the channel's members, sourced reactively from `channel.state.membersStore`.
 */
export function useChannelMembersState(channel: Channel): Record<string, ChannelMemberResponse>;
export function useChannelMembersState(
  channel?: Channel,
): Record<string, ChannelMemberResponse> | undefined;
export function useChannelMembersState(channel?: Channel) {
  return useStateStore(channel?.state?.membersStore, selector)?.members;
}
