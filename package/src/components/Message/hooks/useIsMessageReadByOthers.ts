import { useCallback } from 'react';

import type { LocalMessage, MessageReceiptsSnapshot } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useStateStore } from '../../../hooks/useStateStore';

/**
 * Whether at least one other member has read the message, read from the channel's
 * `messageReceiptsTracker.snapshotStore`.
 *
 * It compares the message against `lastReadRefByOthers`, the furthest point anyone else has read.
 * Read cursors only move forward, so an older message never reports less than a newer one, which
 * the per-message maps cannot guarantee as they mark only the message each cursor lands on.
 * Use `useMessageReadData` to get the users who read the message.
 *
 * @param params.message The message to check.
 * @returns Whether another member has read the message.
 */
export const useIsMessageReadByOthers = ({ message }: { message?: LocalMessage }) => {
  const { channel } = useChannelContext();
  const createdAt = message?.created_at;

  const selector = useCallback(
    (snapshot: MessageReceiptsSnapshot) => {
      const ref = snapshot.lastReadRefByOthers;
      return {
        readByOthers:
          !!ref && typeof createdAt === 'number' && Number.isFinite(createdAt)
            ? createdAt <= ref.timestamp
            : false,
      };
    },
    [createdAt],
  );

  const { readByOthers } = useStateStore(channel.messageReceiptsTracker.snapshotStore, selector);

  return readByOthers;
};
