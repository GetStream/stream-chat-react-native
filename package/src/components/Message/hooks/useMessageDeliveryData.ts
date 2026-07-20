import { useCallback } from 'react';

import type { LocalMessage, MessageReceiptsSnapshot, UserResponse } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useStateStore } from '../../../hooks/useStateStore';

const EMPTY_DELIVERED: UserResponse[] = [];

/**
 * Returns the users the given message has been delivered to, sourced reactively from the
 * channel's `messageReceiptsTracker.snapshotStore` (precomputed `deliveredByMessageId`).
 * Updates whenever the receipts snapshot changes — no manual event subscription required.
 */
export const useMessageDeliveredData = ({ message }: { message?: LocalMessage }) => {
  const { channel } = useChannelContext();
  const messageId = message?.id ?? '';

  const selector = useCallback(
    (snapshot: MessageReceiptsSnapshot) => ({
      deliveredTo: snapshot.deliveredByMessageId[messageId] ?? EMPTY_DELIVERED,
    }),
    [messageId],
  );

  const { deliveredTo } = useStateStore(channel.messageReceiptsTracker.snapshotStore, selector);

  return deliveredTo;
};
