import { useContext, useEffect } from 'react';

import { ChatContext } from '../../../../context';

export const useChannelTruncated = ({
  onChannelTruncated,
  setChannels,
  setForceUpdate,
}) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    const handleEvent = (e) => {
      if (typeof onChannelTruncated === 'function') {
        onChannelTruncated(setChannels, e);
      }
      setForceUpdate((count) => count + 1);
    };

    client.on('channel.truncated', handleEvent);
    return () => client.off('channel.truncated', handleEvent);
  }, []);
};
