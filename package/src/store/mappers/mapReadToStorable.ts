import type { ReadResponse } from 'stream-chat';

import { mapDateTimeToStorable } from './mapDateTimeToStorable';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { TableRow } from '../types';

export const mapReadToStorable = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  cid,
  read,
}: {
  cid: string;
  read: ReadResponse<StreamChatGenerics>;
}): TableRow<'reads'> => {
  const { last_read, unread_messages, user } = read;

  return {
    cid,
    lastRead: mapDateTimeToStorable(last_read),
    unreadMessages: unread_messages,
    userId: user?.id,
  };
};
