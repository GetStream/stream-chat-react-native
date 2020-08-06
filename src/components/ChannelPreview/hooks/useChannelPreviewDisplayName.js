import { useState, useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

export const useChannelPreviewDisplayName = (channel) => {
  const { client } = useContext(ChatContext);
  const [displayName, setDisplayName] = useState(
    getChannelPreviewDisplayName(channel, client),
  );

  useEffect(() => {
    setDisplayName(getChannelPreviewDisplayName(channel, client));
  }, [channel]);

  return displayName;
};

const getChannelPreviewDisplayName = (channel, client) => {
  const currentUserId = client?.user?.id;
  const channelName = channel?.data?.name;

  if (typeof channelName === 'string') {
    return channelName;
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
