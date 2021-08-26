import { useEffect, useState } from 'react';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { FormatName, useUserFormat } from '../../../contexts/formatContext/UserFormatContext';

import { vw } from '../../../utils/utils';

import type { Channel } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

const maxCharacterLengthDefault = (vw(100) - 16) / 6;

export const getChannelPreviewDisplayName = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  {
    channelName,
    currentUserId,
    maxCharacterLength,
    members,
  }: {
    maxCharacterLength: number;
    channelName?: string;
    currentUserId?: string;
    members?: Channel<At, Ch, Co, Ev, Me, Re, Us>['state']['members'];
  },
  formatName: FormatName<Us>,
) => {
  if (channelName) return channelName;

  const channelMembers = Object.values(members || {});
  const otherMembers = channelMembers.filter((member) => member.user?.id !== currentUserId);

  const name = otherMembers.slice(0).reduce((returnString, currentMember, index, originalArray) => {
    const returnStringLength = returnString.length;
    const currentMemberName = formatName(currentMember.user) || 'Unknown User';
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  channel?: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  characterLength?: number,
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const currentUserId = client.userID;
  const members = channel?.state.members;
  const numOfMembers = Object.keys(members || {}).length;
  const channelName = channel?.data?.name;
  const maxCharacterLength = characterLength || maxCharacterLengthDefault;

  const { formatName } = useUserFormat<Us>();
  const [displayName, setDisplayName] = useState(
    getChannelPreviewDisplayName(
      {
        channelName,
        currentUserId,
        maxCharacterLength,
        members,
      },
      formatName,
    ),
  );

  useEffect(() => {
    setDisplayName(
      getChannelPreviewDisplayName(
        {
          channelName,
          currentUserId,
          maxCharacterLength,
          members,
        },
        formatName,
      ),
    );
  }, [channelName, currentUserId, maxCharacterLength, numOfMembers]);

  return displayName;
};
