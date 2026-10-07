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

const hasOtherUser = (users: UserResponse[] | undefined, currentUserId: string | undefined) =>
  !!users && (users.length > 1 || (users.length === 1 && users[0].id !== currentUserId));

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
  const currentUserId = client.user?.id;

  const selector = useCallback(
    (snapshot: MessageReceiptsSnapshot) => ({
      isDelivered: hasOtherUser(snapshot.deliveredByMessageId[messageId], currentUserId),
      isRead: hasOtherUser(snapshot.readersByMessageId[messageId], currentUserId),
    }),
    [currentUserId, messageId],
  );

  const { isDelivered, isRead } = useStateStore(
    channel.messageReceiptsTracker.snapshotStore,
    selector,
  );

  const status = useMemo<MessageDeliveryStatus | undefined>(() => {
    if (!isReadEventsEnabled) {
      return MessageDeliveryStatus.NOT_SENT_BY_CURRENT_USER;
    }

    const isOwnMessage = !!currentUserId && lastMessage?.user?.id === currentUserId;
    if (lastMessage?.created_at == null || !isOwnMessage) {
      return undefined;
    }

    if (isRead) {
      return MessageDeliveryStatus.READ;
    }

    if (isDelivered) {
      return MessageDeliveryStatus.DELIVERED;
    }

    return MessageDeliveryStatus.SENT;
  }, [currentUserId, isDelivered, isReadEventsEnabled, isRead, lastMessage]);

  return { status };
};
