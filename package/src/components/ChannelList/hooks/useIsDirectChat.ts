import { useMemo } from 'react';

import type { Channel } from 'stream-chat';

import { useChannelMembersState } from './useChannelMembersState';

import { useChatContext } from '../../../contexts';

export const useIsDirectChat = (channel: Channel) => {
  const { client } = useChatContext();
  const ownUserId = client.userID;
  const members = useChannelMembersState(channel);

  const otherMembers = useMemo(
    () => Object.values(members).filter((member) => member.user?.id !== ownUserId),
    [members, ownUserId],
  );

  return otherMembers.length === 1;
};
