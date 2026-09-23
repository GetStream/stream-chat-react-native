import { useCallback } from 'react';

import type { LocalMessage, MessageReceiptsSnapshot } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useStateStore } from '../../../hooks/useStateStore';

/**
 * Whether the given message has been delivered to at least one *other* member, sourced reactively
 * from the channel's `messageReceiptsTracker.snapshotStore`.
 *
 * As {@link useIsMessageReadByOthers}, for delivery: compares against the single furthest point
 * anyone else has reached (`lastDeliveredRefByOthers`) rather than asking who is parked on this
 * message, so the answer is monotonic across the list.
 *
 * Use this for a delivery indicator; `useMessageDeliveredData` answers who has actually received it.
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
