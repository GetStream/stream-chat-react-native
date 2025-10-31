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
    lastDeliveredAt: mapDateTimeToStorable(last_delivered_at),
    lastDeliveredMessageId: last_delivered_message_id,
    lastRead: mapDateTimeToStorable(last_read),
    lastReadMessageId: last_read_message_id,
    unreadMessages: unread_messages,
    userId: user?.id,
  };
};
