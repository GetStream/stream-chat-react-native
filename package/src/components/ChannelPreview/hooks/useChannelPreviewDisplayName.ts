import { useEffect, useState } from 'react';

import type { Channel, ExtendableGenerics } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { vw } from '../../../utils/utils';

const maxCharacterLengthDefault = (vw(100) - 16) / 6;

export const getChannelPreviewDisplayName = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  channelName,
  currentUserId,
  maxCharacterLength,
  members,
}: {
  maxCharacterLength: number;
  channelName?: string;
  currentUserId?: string;
  members?: Channel<StreamChatClient>['state']['members'];
}) => {
  if (channelName) return channelName;

  const channelMembers = Object.values(members || {});
  const otherMembers = channelMembers.filter((member) => member.user?.id !== currentUserId);

  const name = otherMembers.slice(0).reduce((returnString, currentMember, index, originalArray) => {
    const returnStringLength = returnString.length;
    const currentMemberName = currentMember.user?.name || currentMember.user?.id || 'Unknown User';
    // a rough approximation of when the +Number shows up
    if (returnStringLength + (currentMemberName.length + 2) < maxCharacterLength) {
      if (returnStringLength) {
        returnString += `, ${currentMemberName}`;
      } else {
        returnString = currentMemberName;
      }
    } else {
      const remainingMembers = originalArray.length - index;
      returnString += `, +${remainingMembers}`;
      originalArray.splice(1); // exit early
    }
    return returnString;
  }, '');

  return name;
};

export const useChannelPreviewDisplayName = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  channel?: Channel<StreamChatClient>,
  characterLength?: number,
) => {
  const { client } = useChatContext<StreamChatClient>();

  const currentUserId = client.userID;
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
