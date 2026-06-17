import { useMemo } from 'react';

import type { Channel } from 'stream-chat';

import { useChannelMembersState } from '../components/ChannelList/hooks/useChannelMembersState';

/**
 * Determines whether the user with the given id is already a member of the channel.
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
