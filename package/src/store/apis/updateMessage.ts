import type { MessageResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { PreparedQueries } from '../types';

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
    QuickSqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
