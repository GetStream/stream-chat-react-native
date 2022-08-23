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

  members?.forEach((member) => {
    if (member.user) {
      queries.push(createUpsertQuery('users', mapUserToStorable(member.user)));
    }

    queries.push(
      createUpsertQuery(
        'members',
        mapMemberToStorable({
          cid,
          member,
        }),
      ),
    );
  });

  if (flush) {
    QuickSqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
