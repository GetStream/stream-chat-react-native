import type { ChannelMemberResponse } from 'stream-chat';

import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';

export const deleteMember = ({
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

  if (flush) {
    QuickSqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
