import { useState, useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

export const useChannelPreviewDisplayName = (channel) => {
  const { client } = useContext(ChatContext);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (channel.data.name && typeof channel.data.name === 'string') {
      setDisplayName(channel.data.name);
      return;
    }

    const members = channel.state ? Object.values(channel.state.members) : [];
    const otherMembers = members.filter(
      (member) => member.user.id !== client.user.id,
    );
    const name = otherMembers
      .map((member) => member.user.name || member.user.id || 'Unnamed User')
      .join(', ');

    setDisplayName(name);
  }, [channel]);

  return displayName;
};
