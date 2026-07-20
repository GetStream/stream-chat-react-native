import { useCallback } from 'react';

import type { LocalMessage, MessageReceiptsSnapshot } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useStateStore } from '../../../hooks/useStateStore';

/**
 * Returns the number of users who have read the given message, sourced reactively from the
 * channel's `messageReceiptsTracker.snapshotStore`.
 *
 * Selecting the count (a number, compared by value) instead of the readers array (compared by
 * reference) means a row only re-renders when the count actually changes — not on every receipts
 * emit that reallocates the array. Prefer this over `useMessageReadData` whenever you only need
 * the count (e.g. read indicators); use `useMessageReadData` when you need the actual users.
 */
export const useMessageReadCount = ({ message }: { message?: LocalMessage }) => {
  const { channel } = useChannelContext();
  const messageId = message?.id ?? '';

  const selector = useCallback(
    (snapshot: MessageReceiptsSnapshot) => ({
      readCount: snapshot.readersByMessageId[messageId]?.length ?? 0,
    }),
    [messageId],
  );

  const { readCount } = useStateStore(channel.messageReceiptsTracker.snapshotStore, selector);

  return readCount;
};
