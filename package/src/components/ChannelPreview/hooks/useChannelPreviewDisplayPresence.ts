import { useEffect, useState } from 'react';

import type { Channel, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

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

const getChannelPreviewDisplayPresence = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType,
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const currentUserId = client.userID;

  if (currentUserId) {
    const members = Object.values(channel.state.members);
    const otherMembers = members.filter((member) => member.user?.id !== currentUserId);

    if (otherMembers.length === 1) {
      return !!otherMembers[0].user?.online;
    }
  }
  return false;
};

/**
 * Hook to set the display avatar presence for channel preview
 * @param {*} channel
 *
 * @returns {boolean} e.g., true
 */
export const useChannelPreviewDisplayPresence = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const currentUserId = client.userID;
  const members = Object.values(channel.state.members).filter(
    (member) => !!member.user?.id && !!currentUserId && member.user?.id !== currentUserId,
  );
  const channelMemberOnline = members.some((member) => member.user?.online);

  const [displayPresence, setDisplayPresence] = useState(false);

  useEffect(() => {
    setDisplayPresence(getChannelPreviewDisplayPresence(channel, client));
  }, [channelMemberOnline]);

  return displayPresence;
};
