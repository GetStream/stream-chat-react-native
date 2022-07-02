import type { ReadResponse } from 'stream-chat';

import { mapStorableToUser } from './mapStorableToUser';

import type { DefaultStreamChatGenerics } from '../../types/types';

import type { JoinedReadRow, ReadRow } from '../types';

export const mapStorableToRead = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  row: JoinedReadRow,
): ReadResponse<StreamChatGenerics> => {
  const { lastRead, unreadMessages, user } = row;

  return {
    last_read: lastRead,
    unread_messages: unreadMessages,
    user: mapStorableToUser(user),
  };
};
