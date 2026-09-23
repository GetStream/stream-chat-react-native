import { useCallback } from 'react';

import type { LocalMessage, MessageReceiptsSnapshot } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useStateStore } from '../../../hooks/useStateStore';

/**
 * Whether at least one *other* member has read the given message, sourced reactively from the
 * channel's `messageReceiptsTracker.snapshotStore`.
 *
 * Compares against `lastReadRefByOthers` — the single furthest point anyone else has reached —
 * rather than asking who is parked on this message. Read cursors only move forward, so one
 * comparison answers every message, and an older message can never report less than a newer one.
 * The per-message maps cannot express that: they mark only the message each cursor happens to land
 * on, so every message before it looks unread.
 *
 * Use this for a read indicator. `useMessageReadData` answers a different question — the users who
 * have read the message — and is what a message-info screen wants.
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
