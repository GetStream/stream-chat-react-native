import { useCallback, useEffect, useState } from 'react';

import { LocalMessage } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';

export const useMessageDeliveredData = ({ message }: { message: LocalMessage }) => {
  const { channel } = useChannelContext();
  const calculate = useCallback(() => {
    if (!message.created_at) {
      return 0;
    }
    const messageRef = {
      msgId: message.id,
      timestampMs: new Date(message.created_at).getTime(),
    };
    return channel.messageReceiptsTracker.deliveredForMessage(messageRef).length;
  }, [channel, message]);

  const [deliveredBy, setDeliveredBy] = useState<number>(calculate());

  useEffect(() => {
    const { unsubscribe } = channel.on('message.delivered', () => setDeliveredBy(calculate()));
    return unsubscribe;
  }, [channel, calculate]);

  return deliveredBy;
};
