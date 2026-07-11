import { useCallback } from 'react';

import type { LocalMessage, MessageReceiptsSnapshot } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useStateStore } from '../../../hooks/useStateStore';

/**
 * Returns the number of users the given message has been delivered to, sourced reactively from
 * the channel's `messageReceiptsTracker.snapshotStore`.
 *
 * Selecting the count (a number, compared by value) instead of the delivered-to array (compared
 * by reference) means a row only re-renders when the count actually changes — not on every
 * receipts emit that reallocates the array. Prefer this over `useMessageDeliveredData` whenever
 * you only need the count; use `useMessageDeliveredData` when you need the actual users.
 */
export const useMessageDeliveredToCount = ({ message }: { message?: LocalMessage }) => {
  const { channel } = useChannelContext();
  const messageId = message?.id ?? '';

  const selector = useCallback(
    (snapshot: MessageReceiptsSnapshot) => ({
      deliveredToCount: snapshot.deliveredByMessageId[messageId]?.length ?? 0,
    }),
    [messageId],
  );

  const { deliveredToCount } = useStateStore(
    channel.messageReceiptsTracker.snapshotStore,
    selector,
  );

  return deliveredToCount;
};
