import { useMemo } from 'react';

import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

const ELLIPSIS = '...';

const getMemberName = (member: ChannelMemberResponse) =>
  member.user?.name || member.user?.id || 'Unknown User';

export const getChannelPreviewDisplayName = ({
  channelName,
  characterLimit,
  currentUserId,
  members,
}: {
  characterLimit: number;
  channelName?: string;
  currentUserId?: string;
  members?: Channel['state']['members'];
}): string => {
  if (channelName) {
    return channelName.length > characterLimit
      ? `${channelName.slice(0, characterLimit - ELLIPSIS.length)}${ELLIPSIS}`
      : channelName;
  }

  const channelMembers = Object.values(members || {});

  const otherMembers = channelMembers.filter((member) => member.user?.id !== currentUserId);
  otherMembers.sort((prevUser, nextUser) =>
    (prevUser?.user?.name ?? '')
      .toLowerCase()
      .localeCompare((nextUser?.user?.name ?? '').toLocaleUpperCase()),
  );

  const createChannelNameSuffix = (remainingNumberOfMembers: number) =>
    remainingNumberOfMembers <= 1 ? `${ELLIPSIS}` : `,${ELLIPSIS}+${remainingNumberOfMembers}`;

  if (otherMembers.length === 1) {
    const name = getMemberName(otherMembers[0]);
    return name.length > characterLimit
      ? `${name.slice(0, characterLimit - ELLIPSIS.length)}${ELLIPSIS}`
      : name;
  }

  const name = otherMembers.reduce((result, currentMember, index, originalArray) => {
    if (result.length >= characterLimit) {
      return result;
    }

    const currentMemberName = getMemberName(currentMember);

    const resultHasSpaceForCurrentMemberName =
      result.length + (currentMemberName.length + ELLIPSIS.length) < characterLimit;

    if (resultHasSpaceForCurrentMemberName) {
      return result.length > 0 ? `${result}, ${currentMemberName}` : `${currentMemberName}`;
    } else {
      const remainingNumberOfMembers = originalArray.length - index;
      const truncateLimit = characterLimit - (ELLIPSIS.length + result.length);
      const tuncatedCurrentMemberName = `, ${currentMemberName.slice(0, truncateLimit)}`;

      const channelNameSuffix = createChannelNameSuffix(remainingNumberOfMembers);

      return `${result}${tuncatedCurrentMemberName}${channelNameSuffix}`;
    }
  }, '');

  return name;
};

export const useChannelPreviewDisplayName = (channel?: Channel) => {
  const { client } = useChatContext();

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
      return `${firstTwoMembers.join(', ')}${remainingMembers.length > 0 ? ` and ${remainingMembers.length} others` : ''}`;
    }
  }, [channelName, currentUserId, members]);

  return displayName;
};
