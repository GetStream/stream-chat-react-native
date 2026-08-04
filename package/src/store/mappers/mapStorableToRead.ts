import type { ReadStateResponse } from 'stream-chat';

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
    last_delivered_at: lastDeliveredAt ? new Date(lastDeliveredAt) : undefined,
    last_delivered_message_id: lastDeliveredMessageId,
    last_read: new Date(lastRead),
    last_read_message_id: lastReadMessageId,
    unread_messages: unreadMessages ?? 0,
    user: mapStorableToUser(user),
  };
};
