import { useEffect, useRef, useState } from 'react';

import { Event, LocalMessage, UserResponse } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStableCallback } from '../../../hooks';

export const useMessageDeliveredData = ({ message }: { message?: LocalMessage }) => {
  const { channel } = useChannelContext();
  const { client } = useChatContext();

  const messageIdRef = useRef<string>(message?.id);

  const calculate = useStableCallback(() => {
    if (!message?.created_at) {
      return [];
    }
    const messageRef = {
      msgId: message.id,
      timestampMs: new Date(message.created_at).getTime(),
    };
    return channel.messageReceiptsTracker.deliveredForMessage(messageRef);
  });

  const [deliveredTo, setDeliveredTo] = useState<UserResponse[]>(() => calculate());

  if (!!messageIdRef.current && !!message?.id && messageIdRef.current !== message.id) {
    setDeliveredTo(calculate());
    messageIdRef.current = message.id;
  }

  useEffect(() => {
    const { unsubscribe } = channel.on('message.delivered', (event: Event) => {
      /**
       * An optimization to only re-calculate if the event is received by a different user.
       */
      if (event.user?.id !== client.user?.id) {
        setDeliveredTo(calculate());
      }
    });
    return unsubscribe;
  }, [channel, calculate, client.user?.id]);

  return deliveredTo;
};
