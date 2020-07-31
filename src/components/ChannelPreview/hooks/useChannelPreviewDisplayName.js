import { useState, useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

export const useChannelPreviewDisplayName = (channel) => {
  const { client } = useContext(ChatContext);
  const [displayName, setDisplayName] = useState(
    getChannelPreviewDisplayName(channel, client.user.id),
  );

  useEffect(() => {
    setDisplayName(getChannelPreviewDisplayName(channel, client.user.id));
  }, [channel]);

  return displayName;
};

const getChannelPreviewDisplayName = (channel, currentUserId) => {
  if (typeof channel?.data?.name === 'string') {
    return channel.data.name;
  } else {
    const members = Object.values(channel?.state?.members || {});
    const otherMembers = members.filter(
      (member) => member.user.id !== currentUserId,
    );
    const name = otherMembers
      .map((member) => member.user.name || member.user.id || 'Unnamed User')
      .join(', ');

    return name;
  }
};
