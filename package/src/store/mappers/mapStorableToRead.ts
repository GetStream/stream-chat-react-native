import type { ReadResponse } from 'stream-chat';

import { mapStorableToUser } from './mapStorableToUser';

import type { TableRowJoinedUser } from '../types';

export const mapStorableToRead = (row: TableRowJoinedUser<'reads'>): ReadResponse => {
  const { lastRead, unreadMessages, user, lastReadMessageId } = row;

  return {
    last_read: lastRead,
    last_read_message_id: lastReadMessageId,
    unread_messages: unreadMessages,
    user: mapStorableToUser(user),
  };
};
