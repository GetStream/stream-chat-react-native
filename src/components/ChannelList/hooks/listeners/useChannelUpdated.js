import { useContext, useEffect } from 'react';

import { ChatContext } from '../../../../context';

export const useChannelUpdated = ({ onChannelUpdated, setChannels }) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    const handleEvent = (e) => {
      if (typeof onChannelUpdated === 'function') {
        onChannelUpdated(setChannels, e);
      } else {
        setChannels((channels) => {
          const index = channels.findIndex(
            (c) => c.cid === (e.cid || e.channel?.cid),
          );
          if (index >= 0 && e.channel) {
            channels[index].data = e.channel;
          }
          return [...channels];
        });
      }
    };

    client.on('channel.updated', handleEvent);
    return () => client.off('channel.updated', handleEvent);
  }, []);
};
