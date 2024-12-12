import type { ChannelMemberResponse } from 'stream-chat';

import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteMember = async ({
  cid,
  flush = true,
  member,
}: {
  cid: string;
  member: ChannelMemberResponse;
  flush?: boolean;
}) => {
  const query = createDeleteQuery('members', {
    cid,
    userId: member.user_id,
  });

  SqliteClient.logger?.('info', 'deleteMember', {
    cid,
    flush,
    userId: member.user_id,
  });

  if (flush) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
