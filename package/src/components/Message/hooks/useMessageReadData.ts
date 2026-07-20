import { useCallback } from 'react';

import type { LocalMessage, MessageReceiptsSnapshot, UserResponse } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useStateStore } from '../../../hooks/useStateStore';

const EMPTY_READERS: UserResponse[] = [];

/**
 * Returns the users who have read the given message, sourced reactively from the channel's
 * `messageReceiptsTracker.snapshotStore` (precomputed `readersByMessageId`). Updates whenever
 * the receipts snapshot changes — no manual event subscription required.
 */
export const useMessageReadData = ({ message }: { message?: LocalMessage }) => {
  const { channel } = useChannelContext();
  const messageId = message?.id ?? '';

  const selector = useCallback(
    (snapshot: MessageReceiptsSnapshot) => ({
      readBy: snapshot.readersByMessageId[messageId] ?? EMPTY_READERS,
    }),
    [messageId],
  );

  const { readBy } = useStateStore(channel.messageReceiptsTracker.snapshotStore, selector);

  return readBy;
};
