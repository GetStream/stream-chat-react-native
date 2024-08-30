import { useEffect, useState } from 'react';

import type { Channel, StreamChat } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const getChannelPreviewDisplayAvatar = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
  client: StreamChat<StreamChatGenerics>,
) => {
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
export const useChannelPreviewDisplayAvatar = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const { client } = useChatContext<StreamChatGenerics>();

  const channelData = channel?.data;
  const image = channelData?.image;
  const name = channelData?.name;
  const id = client?.user?.id;

  const [displayAvatar, setDisplayAvatar] = useState(
    getChannelPreviewDisplayAvatar(channel, client),
  );

  useEffect(() => {
    setDisplayAvatar(getChannelPreviewDisplayAvatar(channel, client));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, image, name]);

  return displayAvatar;
};
