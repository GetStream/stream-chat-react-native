import { useEffect, useState } from 'react';

import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { vw } from '../../../utils/utils';

const DEFAULT_MAX_CHARACTER_LENGTH = (vw(100) - 16) / 6;

const ELLIPSIS = `...`;

const getMemberName = (member: ChannelMemberResponse) =>
  member.user?.name || member.user?.id || 'Unknown User';

export const getChannelPreviewDisplayName = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channelName,
  characterLimit,
  currentUserId,
  members,
}: {
  characterLimit: number;
  channelName?: string;
  currentUserId?: string;
  members?: Channel<StreamChatGenerics>['state']['members'];
}): string => {
  if (channelName) return channelName;

  const channelMembers = Object.values(members || {});

  const otherMembers = channelMembers.filter((member) => member.user?.id !== currentUserId);
  otherMembers.sort((prevUser, nextUser) =>
    (prevUser?.user?.name ?? '')
      .toLowerCase()
      .localeCompare((nextUser?.user?.name ?? '').toLocaleUpperCase()),
  );

  const createChannelNameSuffix = (remainingNumberOfMembers: number) =>
    remainingNumberOfMembers <= 1 ? `${ELLIPSIS}` : `,${ELLIPSIS}+${remainingNumberOfMembers}`;

  const name = otherMembers.reduce((result, currentMember, index, originalArray) => {
    if (result.length >= characterLimit) {
      return result;
    }

    const currentMemberName = getMemberName(currentMember);

    const resultHasSpaceForCurrentMemberName =
      result.length + (currentMemberName.length + ELLIPSIS.length) < characterLimit;
    if (resultHasSpaceForCurrentMemberName) {
      return result.length > 0 ? `${result}, ${currentMemberName}, ` : currentMemberName;
    } else {
      const remainingNumberOfMembers = originalArray.length - index;
      const truncateLimit = characterLimit - (ELLIPSIS.length + result.length);
      const tuncatedCurrentMemberName = `${currentMemberName.slice(0, truncateLimit)}`;

      const channelNameSuffix = createChannelNameSuffix(remainingNumberOfMembers);

      return `${result}${tuncatedCurrentMemberName}${channelNameSuffix}`;
    }
  }, '');

  return name;
};

export const useChannelPreviewDisplayName = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel?: Channel<StreamChatGenerics>,
  characterLength?: number,
) => {
  const { client } = useChatContext<StreamChatGenerics>();

  const currentUserId = client?.userID;
  const members = channel?.state?.members;
  const numOfMembers = Object.keys(members || {}).length;
  const channelName = channel?.data?.name;
  const characterLimit = characterLength || DEFAULT_MAX_CHARACTER_LENGTH;
  const [displayName, setDisplayName] = useState(
    getChannelPreviewDisplayName({
      channelName,
      characterLimit,
      currentUserId,
      members,
    }),
  );

  useEffect(() => {
    setDisplayName(
      getChannelPreviewDisplayName({
        channelName,
        characterLimit,
        currentUserId,
        members,
      }),
    );
  }, [channelName, currentUserId, characterLimit, numOfMembers]);

  return displayName;
};
