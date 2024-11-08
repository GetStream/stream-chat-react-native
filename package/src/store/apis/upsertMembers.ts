import type { ChannelMemberResponse } from 'stream-chat';

import { mapMemberToStorable } from '../mappers/mapMemberToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

export const upsertMembers = async ({
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

  SqliteClient.logger?.('info', 'upsertMembers', {
    cid,
    flush,
    storableMembers,
    storableUsers,
  });

  if (flush) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
