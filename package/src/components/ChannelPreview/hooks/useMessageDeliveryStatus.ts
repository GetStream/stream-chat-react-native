import { useCallback, useEffect, useState } from 'react';

import { Channel, Event, LocalMessage, MessageResponse } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

export enum MessageDeliveryStatus {
  NOT_SENT_BY_CURRENT_USER = 'not_sent_by_current_user',
  DELIVERED = 'delivered',
  READ = 'read',
  SENT = 'sent',
}

type MessageDeliveryStatusProps = {
  channel: Channel;
  lastMessage: LocalMessage;
  isReadEventsEnabled: boolean;
};

export const useMessageDeliveryStatus = ({
  channel,
  lastMessage,
  isReadEventsEnabled = true,
}: MessageDeliveryStatusProps) => {
  const { client } = useChatContext();
  const [status, setStatus] = useState<MessageDeliveryStatus | undefined>(undefined);

  const isOwnMessage = useCallback(
    (message: LocalMessage | MessageResponse) =>
      client.user && message && message.user?.id === client.user.id,
    [client],
  );

  useEffect(() => {
    if (!lastMessage) {
      setStatus(undefined);
    }

    if (!isReadEventsEnabled) {
      setStatus(MessageDeliveryStatus.NOT_SENT_BY_CURRENT_USER);
      return;
    }

    if (!lastMessage?.created_at || !isOwnMessage(lastMessage)) {
      return;
    }

    const msgRef = {
      msgId: lastMessage.id,
      timestampMs: new Date(lastMessage.created_at).getTime(),
    };

    const readerOfMessage = channel.messageReceiptsTracker.readersForMessage(msgRef);
    const deliveredForMessage = channel.messageReceiptsTracker.deliveredForMessage(msgRef);

    setStatus(
      readerOfMessage.length > 1 ||
        (readerOfMessage.length === 1 && readerOfMessage[0].id !== client.user?.id)
        ? MessageDeliveryStatus.READ
        : deliveredForMessage.length > 1 ||
            (deliveredForMessage.length === 1 && deliveredForMessage[0].id !== client.user?.id)
          ? MessageDeliveryStatus.DELIVERED
          : MessageDeliveryStatus.SENT,
    );
  }, [channel, client.user?.id, isOwnMessage, isReadEventsEnabled, lastMessage]);

  useEffect(() => {
    const handleMessageNew = (event: Event) => {
      // the last message is not mine, so do not show the delivery status
      if (event.message && !isOwnMessage(event.message)) {
        return setStatus(undefined);
      }
      return setStatus(MessageDeliveryStatus.SENT);
    };
    const { unsubscribe } = channel.on('message.new', handleMessageNew);
    return unsubscribe;
  }, [channel, isOwnMessage]);

  useEffect(() => {
    if (!isOwnMessage(lastMessage)) return;
    const handleMessageDelivered = (event: Event) => {
      if (
        event.user?.id !== client.user?.id &&
        lastMessage &&
        lastMessage.id === event.last_delivered_message_id
      )
        setStatus(MessageDeliveryStatus.DELIVERED);
    };

    const handleMarkRead = (event: Event) => {
      if (event.user?.id !== client.user?.id) setStatus(MessageDeliveryStatus.READ);
    };

    const listeners = [
      channel.on('message.delivered', handleMessageDelivered),
      channel.on('message.read', handleMarkRead),
    ];

    return () => listeners.forEach((l) => l.unsubscribe());
  }, [channel, client, isOwnMessage, lastMessage]);

  return { status };
};
