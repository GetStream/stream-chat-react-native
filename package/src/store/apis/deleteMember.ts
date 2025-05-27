import type { ChannelMemberResponse } from 'stream-chat';

import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteMember = async ({
  cid,
  execute = true,
  member,
}: {
  cid: string;
  member: ChannelMemberResponse;
  execute?: boolean;
}) => {
  const query = createDeleteQuery('members', {
    cid,
    userId: member.user_id,
  });

  SqliteClient.logger?.('info', 'deleteMember', {
    cid,
    execute,
    userId: member.user_id,
  });

  if (execute) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
