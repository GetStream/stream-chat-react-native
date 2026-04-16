import { useMemo } from 'react';

import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

const getMemberName = (member: ChannelMemberResponse) =>
  member.user?.name || member.user?.id || 'Unknown User';

export const useChannelPreviewDisplayName = (channel?: Channel) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const currentUserId = client?.userID;
  const members = channel?.state?.members;
  const channelName = channel?.data?.name;

  const displayName = useMemo(() => {
    if (channelName) {
      return channelName;
    }
    // Get first name of the members without the current user.
    const membersWithoutSelf = Object.values(members || {}).filter(
      (member) => member.user?.id !== currentUserId,
    );

    if (membersWithoutSelf.length === 1) {
      return getMemberName(membersWithoutSelf[0]);
    } else {
      const names = membersWithoutSelf
        .map((member) => getMemberName(member))
        .map((name) => name.split(' ')[0]);
      const sortedMembers = names.sort((a, b) => a.localeCompare(b));
      // Now show the first 2 members and the rest as +N. Don't show the +N if the remaining members are 0.
      const firstTwoMembers = sortedMembers.slice(0, 2);
      const remainingMembers = sortedMembers.slice(2);
      return `${firstTwoMembers.join(', ').concat(' ')}${remainingMembers.length > 0 ? t('and {{ count }} others', { count: remainingMembers.length }) : ''}`;
    }
  }, [channelName, currentUserId, members, t]);

  return displayName;
};
