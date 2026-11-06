import { useCallback } from 'react';

import type { LocalMessage, UserResponse } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useStateStore } from '../../../hooks/useStateStore';

const EMPTY_READERS: UserResponse[] = [];

export const useMessageReadData = ({ message }: { message?: LocalMessage }) => {
  const { channel } = useChannelContext();
  const msgId = message?.id;
  const createdAt = message?.created_at;

  const selector = useCallback(
    () => ({
      readBy:
        msgId && typeof createdAt === 'number' && Number.isFinite(createdAt)
          ? channel.messageReceiptsTracker.readersForMessage({ msgId, timestamp: createdAt })
          : EMPTY_READERS,
    }),
    [channel, createdAt, msgId],
  );

  const { readBy } = useStateStore(channel.messageReceiptsTracker.snapshotStore, selector);

  return readBy;
};
