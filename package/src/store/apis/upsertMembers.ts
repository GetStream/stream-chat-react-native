import type { ChannelMemberResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapMemberToStorable } from '../mappers/mapMemberToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import type { PreparedQueries } from '../types';
import { createUpsertQuery } from '../utils/createUpsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const upsertMembers = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  cid,
  flush = true,
  members,
}: {
  cid: string;
  members: ChannelMemberResponse<StreamChatGenerics>[];
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
    executeQueries(queries);
  }

  return queries;
};
