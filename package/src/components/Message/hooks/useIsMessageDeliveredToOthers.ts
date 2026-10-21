import { useCallback } from 'react';

import type { LocalMessage, MessageReceiptsSnapshot } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useStateStore } from '../../../hooks/useStateStore';

/**
 * Whether the message has been delivered to at least one other member, read from the channel's
 * `messageReceiptsTracker.snapshotStore`.
 *
 * Like {@link useIsMessageReadByOthers}, it compares the message against the furthest point anyone
 * else has reached (`lastDeliveredRefByOthers`), so the answer is monotonic across the list.
 * Use `useMessageDeliveredData` to get who received the message.
 *
 * @param params.message The message to check.
 * @returns Whether another member has received the message.
 */
export const useIsMessageDeliveredToOthers = ({ message }: { message?: LocalMessage }) => {
  const { channel } = useChannelContext();
  const createdAt = message?.created_at;

  const selector = useCallback(
    (snapshot: MessageReceiptsSnapshot) => {
      const ref = snapshot.lastDeliveredRefByOthers;
      return {
        deliveredToOthers:
          !!ref && typeof createdAt === 'number' && Number.isFinite(createdAt)
            ? createdAt <= ref.timestamp
            : false,
      };
    },
    [createdAt],
  );

  const { deliveredToOthers } = useStateStore(
    channel.messageReceiptsTracker.snapshotStore,
    selector,
  );

  return deliveredToOthers;
};
