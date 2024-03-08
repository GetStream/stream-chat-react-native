import type { ChannelMemberResponse } from 'stream-chat';

import { mapMemberToStorable } from '../mappers/mapMemberToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { PreparedQueries } from '../types';

export const upsertMembers = ({
  cid,
  flush = true,
  members,
}: {
  cid: string;
  members: ChannelMemberResponse[];
  flush?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  const storableUsers: Array<ReturnType<typeof mapUserToStorable>> = [];
  const storableMembers: Array<ReturnType<typeof mapMemberToStorable>> = [];

  members?.forEach((member) => {
    if (member.user) {
      const storableUser = mapUserToStorable(member.user);
      storableUsers.push(storableUser);
      queries.push(createUpsertQuery('users', storableUser));
    }
    const storableMember = mapMemberToStorable({ cid, member });
    storableMembers.push(storableMember);

    queries.push(createUpsertQuery('members', storableMember));
  });

  QuickSqliteClient.logger?.('info', 'upsertMembers', {
    cid,
    flush,
    storableMembers,
    storableUsers,
  });

  if (flush) {
    QuickSqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
