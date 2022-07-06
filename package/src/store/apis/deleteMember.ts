import type { ChannelMemberResponse } from 'stream-chat';

import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';

export const deleteMember = ({ cid, member }: { cid: string; member: ChannelMemberResponse }) => {
  QuickSqliteClient.executeSql.apply(
    null,
    createDeleteQuery('members', {
      cid,
      userId: member.user_id,
    }),
  );
};
