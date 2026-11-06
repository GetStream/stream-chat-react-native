import { useMemo } from 'react';

import type { Channel } from 'stream-chat';

import { useChannelMembersState } from '../components/ChannelList/hooks/useChannelMembersState';

/**
 * Whether the user with the given ID is a member of the channel.
 *
 * @param channel The channel to check.
 * @param userId The ID of the user. Without it the result is false.
 * @returns True when the user is a member.
 */
export const useIsChannelMember = (channel: Channel, userId?: string) => {
  const members = useChannelMembersState(channel);

  return useMemo(() => {
    if (!userId) {
      return false;
    }

    return Object.values(members).some((member) => member.user?.id === userId);
  }, [members, userId]);
};
