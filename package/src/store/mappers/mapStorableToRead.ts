import type { ReadStateResponse } from 'stream-chat';

import { mapStorableToTimestamp } from './mapStorableToTimestamp';
import { mapStorableToUser } from './mapStorableToUser';

import type { TableRowJoinedUser } from '../types';

export const mapStorableToRead = (row: TableRowJoinedUser<'reads'>): ReadStateResponse => {
  const {
    lastRead,
    unreadMessages,
    user,
    lastReadMessageId,
    lastDeliveredAt,
    lastDeliveredMessageId,
  } = row;

  return {
    last_delivered_at: mapStorableToTimestamp(lastDeliveredAt),
    last_delivered_message_id: lastDeliveredMessageId,
    last_read: mapStorableToTimestamp(lastRead) ?? 0,
    last_read_message_id: lastReadMessageId,
    unread_messages: unreadMessages ?? 0,
    user: mapStorableToUser(user),
  };
};
