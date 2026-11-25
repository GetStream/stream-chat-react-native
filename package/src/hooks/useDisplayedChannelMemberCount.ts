import { Channel } from 'stream-chat';

import { useStateStore } from './useStateStore';

const selector = (state: { activeMemberCount?: number; memberCount: number }) => ({
  activeMemberCount: state.activeMemberCount,
  memberCount: state.memberCount,
});

/**
 * Returns the member count to show in the UI, read reactively from `channel.state`: the active
 * member count (members who are not deactivated or deleted) when it is known, otherwise the member
 * count. The active member count is only known when the channel was queried with
 * `include_active_member_count: true`.
 *
 * @param channel The channel to read from.
 * @returns The member count to display.
 */
export function useDisplayedChannelMemberCount(channel: Channel): number {
  const { activeMemberCount, memberCount } = useStateStore(channel.state, selector);
  return activeMemberCount ?? memberCount;
}
