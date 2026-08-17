import { useCallback, useMemo } from 'react';

import {
  Channel,
  LocalMessage,
  MessageReceiptsSnapshot,
  MessageResponse,
  UserResponse,
} from 'stream-chat';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useStateStore } from '../useStateStore';

export enum MessageDeliveryStatus {
  NOT_SENT_BY_CURRENT_USER = 'not_sent_by_current_user',
  DELIVERED = 'delivered',
  READ = 'read',
  SENT = 'sent',
}

type MessageDeliveryStatusProps = {
  channel: Channel;
  // Only `created_at`/`id`/`user` are read here (never the LocalMessage-only `status`), so a
  // plain `MessageResponse` is accepted too — lets callers pass the channel's last message
  // without asserting it is a `LocalMessage`.
  lastMessage: LocalMessage | MessageResponse;
  isReadEventsEnabled: boolean;
};

const EMPTY_USERS: UserResponse[] = [];

/**
 * Delivery/read status of the last own message, sourced reactively from the channel's
 * `messageReceiptsTracker.snapshotStore` (`readersByMessageId` / `deliveredByMessageId`) — the same
 * store the in-list read/delivered receipt hooks use. Replaces the previous manual
 * `channel.on('message.new'/'message.delivered'/'message.read')` + `useState` machinery so there is
 * a single reactive source of truth for receipts.
 */
export const useMessageDeliveryStatus = ({
  channel,
  lastMessage,
  isReadEventsEnabled = true,
}: MessageDeliveryStatusProps) => {
  const { client } = useChatContext();
  const messageId = lastMessage?.id ?? '';

  const selector = useCallback(
    (snapshot: MessageReceiptsSnapshot) => ({
      deliveredTo: snapshot.deliveredByMessageId[messageId] ?? EMPTY_USERS,
      readers: snapshot.readersByMessageId[messageId] ?? EMPTY_USERS,
    }),
    [messageId],
  );

  const { deliveredTo, readers } = useStateStore(
    channel.messageReceiptsTracker.snapshotStore,
    selector,
  );

  const status = useMemo<MessageDeliveryStatus | undefined>(() => {
    if (!isReadEventsEnabled) {
      return MessageDeliveryStatus.NOT_SENT_BY_CURRENT_USER;
    }

    const currentUserId = client.user?.id;
    const isOwnMessage = !!currentUserId && lastMessage?.user?.id === currentUserId;
    if (!lastMessage?.created_at || !isOwnMessage) {
      return undefined;
    }

    if (readers.length > 1 || (readers.length === 1 && readers[0].id !== currentUserId)) {
      return MessageDeliveryStatus.READ;
    }

    if (
      deliveredTo.length > 1 ||
      (deliveredTo.length === 1 && deliveredTo[0].id !== currentUserId)
    ) {
      return MessageDeliveryStatus.DELIVERED;
    }

    return MessageDeliveryStatus.SENT;
  }, [client.user?.id, deliveredTo, isReadEventsEnabled, lastMessage, readers]);

  return { status };
};
