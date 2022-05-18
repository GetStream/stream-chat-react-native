import { useEffect, useState } from 'react';

import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { vw } from '../../../utils/utils';

const maxCharacterLengthDefault = (vw(100) - 16) / 6;

export const getChannelPreviewDisplayName = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channelName,
  currentUserId,
  maxCharacterLength,
  members,
}: {
  maxCharacterLength: number;
  channelName?: string;
  currentUserId?: string;
  members?: Channel<StreamChatGenerics>['state']['members'];
}): string => {
  if (channelName) return channelName;

  const channelMembers = Object.values(members || {});
  const otherMembers = channelMembers.filter((member) => member.user?.id !== currentUserId);

  const name = otherMembers.slice(0).reduce((returnString, currentMember, index, originalArray) => {
    const returnStringLength = returnString.length;
    const currentMemberName: string =
      currentMember.user?.name || currentMember.user?.id || 'Unknown User';

    const currentNamelessThanMax: boolean =
      returnStringLength + (currentMemberName.length + 3) < maxCharacterLength;
    const currentNamegreaterThanMax = !currentNamelessThanMax;

    if (currentNamelessThanMax) {
      returnStringLength
        ? (returnString += `, ${currentMemberName}`)
        : (returnString = currentMemberName);
    }

    if (currentNamegreaterThanMax) {
      const remainingMembers = originalArray.length - index;
      !returnString ? (returnString = currentMemberName.slice(0, maxCharacterLength)) : false;

      returnString += remainingMembers <= 1 ? `...` : `,... +${remainingMembers}`;
      originalArray.splice(1);
    }
    return returnString;
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
  const members = channel?.state.members;
  const numOfMembers = Object.keys(members || {}).length;
  const channelName = channel?.data?.name;
  const maxCharacterLength = characterLength || maxCharacterLengthDefault;
  const [displayName, setDisplayName] = useState(
    getChannelPreviewDisplayName({
      channelName,
      currentUserId,
      maxCharacterLength,
      members,
    }),
  );

  useEffect(() => {
    setDisplayName(
      getChannelPreviewDisplayName({
        channelName,
        currentUserId,
        maxCharacterLength,
        members,
      }),
    );
  }, [channelName, currentUserId, maxCharacterLength, numOfMembers]);

  return displayName;
};
