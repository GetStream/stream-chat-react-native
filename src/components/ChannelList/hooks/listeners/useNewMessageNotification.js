import { useContext, useEffect } from 'react';
import uniqBy from 'lodash/uniqBy';

import { getChannel } from '../../utils';

import { ChatContext } from '../../../../context';

export const useNewMessageNotification = ({ onMessageNew, setChannels }) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    const handleEvent = async (e) => {
      if (typeof onMessageNew === 'function') {
        onMessageNew(setChannels, e);
      } else {
        const channel = await getChannel(
          client,
          e.channel?.type,
          e.channel?.id,
        );
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    };

    client.on('notification.message_new', handleEvent);
    return () => client.off('notification.message_new', handleEvent);
  }, []);
};
