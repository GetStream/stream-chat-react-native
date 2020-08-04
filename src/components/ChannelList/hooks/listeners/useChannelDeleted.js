import { useContext, useEffect } from 'react';

import { ChatContext } from '../../../../context';

export const useChannelDeleted = ({ onChannelDeleted, setChannels }) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    const handleEvent = (e) => {
      if (onChannelDeleted && typeof onChannelDeleted === 'function') {
        onChannelDeleted(setChannels, e);
      } else {
        setChannels((channels) => {
          const index = channels.findIndex(
            (c) => c.cid === (e.cid || e.channel?.cid),
          );
          if (index >= 0) {
            channels.splice(index, 1);
          }
          return [...channels];
        });
      }
    };

    client.on('channel.deleted', handleEvent);
    return () => client.off('channel.deleted', handleEvent);
  }, []);
};
