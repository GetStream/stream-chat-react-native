import type { ReadStateResponse } from 'stream-chat';

import { mapTimestampToStorable } from './mapTimestampToStorable';

import type { TableRow } from '../types';

export const mapReadToStorable = ({
  cid,
  read,
}: {
  cid: string;
  read: ReadStateResponse;
}): TableRow<'reads'> => {
  const {
    last_read,
    unread_messages,
    user,
    last_read_message_id,
    last_delivered_at,
    last_delivered_message_id,
  } = read;

  return {
    cid,
    lastDeliveredAt: mapTimestampToStorable(last_delivered_at),
    lastDeliveredMessageId: last_delivered_message_id,
    // `0` is the LLC's epoch sentinel; the column is `INTEGER NOT NULL`.
    lastRead: last_read ?? 0,
    lastReadMessageId: last_read_message_id,
    unreadMessages: unread_messages,
    userId: user?.id,
  };
};
