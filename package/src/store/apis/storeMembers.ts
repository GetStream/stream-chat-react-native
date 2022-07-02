import type { ChannelMemberResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapMemberToStorable } from '../mappers/mapMemberToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import type { PreparedQueries } from '../types';
import { createInsertQuery } from '../utils/createInsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const storeMembers = <
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
      queries.push(createInsertQuery('users', mapUserToStorable(member.user)));
    }

    queries.push(
      createInsertQuery(
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
