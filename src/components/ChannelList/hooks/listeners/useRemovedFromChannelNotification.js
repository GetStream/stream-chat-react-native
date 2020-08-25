import { useContext, useEffect } from 'react';

import { ChatContext } from '../../../../context';

export const useRemovedFromChannelNotification = ({
  onRemovedFromChannel,
  setChannels,
}) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    const handleEvent = (e) => {
      if (typeof onRemovedFromChannel === 'function') {
        onRemovedFromChannel(setChannels, e);
      } else {
        setChannels((channels) => {
          const newChannels = channels.filter((c) => c.cid !== e.channel?.cid);
          return [...newChannels];
        });
      }
    };

    client.on('notification.removed_from_channel', handleEvent);
    return () => client.off('notification.removed_from_channel', handleEvent);
  }, []);
};
