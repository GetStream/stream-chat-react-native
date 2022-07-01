import type { ReadResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';

import type { ReadRow } from '../types';

export const mapStorableToRead = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  row: ReadRow,
): ReadResponse<StreamChatGenerics> => {
  const { lastRead, unreadMessages, user } = row;

  return {
    last_read: lastRead,
    unread_messages: unreadMessages,
    user: user ? JSON.parse(user) : {},
  };
};
