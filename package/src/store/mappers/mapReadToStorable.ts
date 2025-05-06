import type { ReadResponse } from 'stream-chat';

import { mapDateTimeToStorable } from './mapDateTimeToStorable';

import type { TableRow } from '../types';

export const mapReadToStorable = ({
  cid,
  read,
}: {
  cid: string;
  read: ReadResponse;
}): TableRow<'reads'> => {
  const { last_read, unread_messages, user } = read;

  return {
    cid,
    lastRead: mapDateTimeToStorable(last_read),
    unreadMessages: unread_messages,
    userId: user?.id,
  };
};
