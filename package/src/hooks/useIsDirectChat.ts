import { useMemo } from 'react';

import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChannelMembersState } from '../components/ChannelList/hooks/useChannelMembersState';
import { useChatContext } from '../contexts';

const pickId = (member: ChannelMemberResponse) => ({ id: member.user?.id });

export const useIsDirectChat = (channel?: Channel) => {
  const { client } = useChatContext();
  const ownUserId = client.userID;
  const members = useChannelMembersState(channel, pickId);

  const otherMembers = useMemo(
    () => Object.values(members ?? {}).filter((member) => member.user?.id !== ownUserId),
    [members, ownUserId],
  );

  return otherMembers.length === 1;
};
