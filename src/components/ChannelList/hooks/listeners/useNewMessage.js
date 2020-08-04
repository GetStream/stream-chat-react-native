import { useContext, useEffect } from 'react';

import { ChatContext } from '../../../../context';
import { moveChannelUp } from '../../utils';

export const useNewMessage = ({ lockChannelOrder, setChannels }) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    const handleEvent = (e) => {
      setChannels((channels) => {
        if (!lockChannelOrder) return moveChannelUp(e.cid, channels);
        return channels;
      });
    };

    client.on('message.new', handleEvent);
    return () => client.off('message.new', handleEvent);
  }, []);
};
