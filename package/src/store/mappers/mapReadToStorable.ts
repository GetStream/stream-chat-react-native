import type { ReadResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ReadRow } from '../types';

export const mapReadToStorable = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  cid,
  read,
}: {
  cid: string;
  read: ReadResponse<StreamChatGenerics>;
}): ReadRow => {
  const { last_read, unread_messages, user } = read;

  return {
    cid,
    lastRead: last_read,
    unreadMessages: unread_messages,
    userId: user?.id,
  };
};
