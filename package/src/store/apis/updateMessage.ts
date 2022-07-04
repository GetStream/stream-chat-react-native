import type { MessageResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import type { PreparedQueries } from '../types';
import { createDeleteQuery } from '../utils/createDeleteQuery';
import { createUpdateQuery } from '../utils/createUpdateQuery';
import { createUpsertQuery } from '../utils/createUpsertQuery';
import { executeQueries } from '../utils/executeQueries';
import { selectQuery } from '../utils/selectQuery';

export const updateMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  flush = true,
  message,
}: {
  message: MessageResponse<StreamChatGenerics>;
  flush?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  queries.push(
    createUpdateQuery('messages', mapMessageToStorable(message), {
      id: message.id,
    }),
  );

  if (message.user) {
    queries.push(createUpsertQuery('users', mapUserToStorable(message.user)));
  }

  queries.push(
    createDeleteQuery('reactions', {
      messageId: message.id,
    }),
  );

  const latestReactions = message.latest_reactions || [];
  const ownReactions = message.own_reactions || [];

  [...latestReactions, ...ownReactions].forEach((r) => {
    if (r.user) {
      queries.push(createUpsertQuery('users', mapUserToStorable(r.user)));
    }

    queries.push(createUpsertQuery('reactions', mapReactionToStorable(r)));
  });

  if (flush) {
    executeQueries(queries);

    setTimeout(() => {
      const result = selectQuery('select userId, type from reactions where messageId = ?', [
        message.id,
      ]);
      console.log(result);
    }, 2000);
  }

  return queries;
};
