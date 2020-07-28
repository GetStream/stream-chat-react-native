import { useState, useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

/**
 * Hook to set the display avatar for channel preview
 * @param {*} channel
 *
 * @returns {object} e.g., { image: 'http://dummyurl.com/test.png', name: 'Uhtred Bebbanburg' }
 */
export const useChannelPreviewDisplayAvatar = (channel) => {
  const { client } = useContext(ChatContext);
  const [displayAvatar, setDisplayAvatar] = useState({});

  useEffect(() => {
    if (channel.data.image) {
      setDisplayAvatar({
        image: channel.data.image,
        name: channel.data.name,
      });
    } else {
      const members = Object.values(channel?.state?.members || {});
      const otherMembers = members.filter(
        (member) => member.user.id !== client.user.id,
      );

      if (otherMembers.length === 1) {
        setDisplayAvatar({
          image: otherMembers[0].user.image,
          name: channel.data.name || otherMembers[0].user.name,
        });
      } else {
        setDisplayAvatar({
          name: channel.data.name,
        });
      }
    }
  }, [channel]);

  return displayAvatar;
};
