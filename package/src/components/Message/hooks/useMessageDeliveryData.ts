import { useCallback } from 'react';

import type { LocalMessage, UserResponse } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useStateStore } from '../../../hooks/useStateStore';

const EMPTY_DELIVERED: UserResponse[] = [];

export const useMessageDeliveredData = ({ message }: { message?: LocalMessage }) => {
  const { channel } = useChannelContext();
  const msgId = message?.id;
  const createdAt = message?.created_at;

  const selector = useCallback(
    () => ({
      deliveredTo:
        msgId && typeof createdAt === 'number' && Number.isFinite(createdAt)
          ? channel.messageReceiptsTracker.deliveredForMessage({ msgId, timestamp: createdAt })
          : EMPTY_DELIVERED,
    }),
    [channel, createdAt, msgId],
  );

  const { deliveredTo } = useStateStore(channel.messageReceiptsTracker.snapshotStore, selector);

  return deliveredTo;
};
