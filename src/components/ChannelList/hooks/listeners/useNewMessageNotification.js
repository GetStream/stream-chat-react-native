import { useContext, useEffect } from 'react';
import uniqBy from 'lodash/uniqBy';

import { ChatContext } from '../../../../context';
import { getChannel } from '../../utils';

export const useNewMessageNotification = ({ onMessageNew, setChannels }) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    const handleEvent = async (e) => {
      if (onMessageNew && typeof onMessageNew === 'function') {
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
