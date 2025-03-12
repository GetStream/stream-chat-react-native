import { useMemo } from 'react';

import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useViewport } from '../../../hooks/useViewport';

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

export const useChannelPreviewDisplayName = (channel?: Channel, characterLength?: number) => {
  const { client } = useChatContext();
  const { vw } = useViewport();

  const DEFAULT_MAX_CHARACTER_LENGTH = Math.floor((vw(100) - 16) / 6);

  const currentUserId = client?.userID;
  const members = channel?.state?.members;
  const channelName = channel?.data?.name;
  const characterLimit = characterLength || DEFAULT_MAX_CHARACTER_LENGTH;
  const numOfMembers = Object.keys(members || {}).length;

  const displayName = useMemo(
    () =>
      getChannelPreviewDisplayName({
        channelName,
        characterLimit,
        currentUserId,
        members,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelName, characterLimit, currentUserId, members, numOfMembers],
  );

  return displayName;
};
