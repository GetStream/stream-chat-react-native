import { useContext, useEffect } from 'react';

import { ChatContext } from '../../../../context';

export const useRemovedFromChannelNotification = ({
  onRemovedFromChannel,
  setChannels,
}) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    const handleEvent = (e) => {
      if (onRemovedFromChannel && typeof onRemovedFromChannel === 'function') {
        onRemovedFromChannel(setChannels, e);
      } else {
        setChannels((channels) => {
          channels.filter((c) => c.cid !== e.channel?.cid);
        });
      }
    };

    client.on('notification.removed_from_channel', handleEvent);
    return () => client.off('notification.removed_from_channel', handleEvent);
  }, []);
};
