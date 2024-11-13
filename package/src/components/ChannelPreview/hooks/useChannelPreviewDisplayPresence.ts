import { useEffect, useState } from 'react';

import type { Channel, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

const getChannelPreviewDisplayPresence = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
  client: StreamChat<StreamChatGenerics>,
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const { client } = useChatContext<StreamChatGenerics>();

  const currentUserId = client.userID;
  const members = Object.values(channel.state.members).filter(
    (member) => !!member.user?.id && !!currentUserId && member.user?.id !== currentUserId,
  );
  const channelMemberOnline = members.some((member) => member.user?.online);

  const [displayPresence, setDisplayPresence] = useState(false);

  useEffect(() => {
    setDisplayPresence(getChannelPreviewDisplayPresence(channel, client));
  }, [channel, channelMemberOnline, client]);

  return displayPresence;
};
