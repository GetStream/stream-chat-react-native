import { useMemo } from 'react';

import type { Channel, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

export const getChannelPreviewDisplayAvatar = (channel: Channel, client: StreamChat) => {
  const currentUserId = client?.user?.id;
  const channelId = channel?.id;
  const channelData = channel?.data;
  const channelName = channelData?.name;
  const channelImage = channelData?.image;

  if (channelImage) {
    return {
      id: channelId,
      image: channelImage,
      name: channelName,
    };
  } else if (currentUserId) {
    const members = Object.values(channel.state?.members);
    const otherMembers = members.filter((member) => member.user?.id !== currentUserId);

    if (otherMembers.length === 1) {
      return {
        id: otherMembers[0].user?.id,
        image: otherMembers[0].user?.image,
        name: channelName || otherMembers[0].user?.name,
      };
    }

    return {
      ids: otherMembers.slice(0, 4).map((member) => member.user?.id || ''),
      images: otherMembers.slice(0, 4).map((member) => member.user?.image || ''),
      names: otherMembers.slice(0, 4).map((member) => member.user?.name || ''),
    };
  }
  return {
    id: channelId,
    name: channelName,
  };
};

/**
 * Hook to set the display avatar for channel preview
 * @param {*} channel
 *
 * @returns {object} e.g., { image: 'http://dummyurl.com/test.png', name: 'Uhtred Bebbanburg' }
 */
export const useChannelPreviewDisplayAvatar = (channel: Channel) => {
  const { client } = useChatContext();

  const displayAvatar = useMemo(
    () => getChannelPreviewDisplayAvatar(channel, client),
    [channel, client],
  );

  return displayAvatar;
};
