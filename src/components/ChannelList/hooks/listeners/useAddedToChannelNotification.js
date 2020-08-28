import { useContext, useEffect } from 'react';
import uniqBy from 'lodash/uniqBy';

import { ChatContext } from '../../../../context';
import { getChannel } from '../../utils';

export const useAddedToChannelNotification = ({
  onAddedToChannel,
  setChannels,
}) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    const handleEvent = async (e) => {
      if (typeof onAddedToChannel === 'function') {
        onAddedToChannel(setChannels, e);
      } else {
        const channel = await getChannel(
          client,
          e.channel?.type,
          e.channel?.id,
        );
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    };

    client.on('notification.added_to_channel', handleEvent);
    return () => client.off('notification.added_to_channel', handleEvent);
  }, []);
};
