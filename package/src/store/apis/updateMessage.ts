import type { MessageResponse } from 'stream-chat';

import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { PreparedQueries } from '../types';

export const updateMessage = ({
  flush = true,
  message,
}: {
  message: MessageResponse;
  flush?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  const messages = QuickSqliteClient.executeSql.apply(
    null,
    createSelectQuery('messages', ['*'], {
      id: message.id,
    }),
  );

  if (messages.length === 0) {
    return queries;
  }

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
