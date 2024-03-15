import type { FormatMessageResponse, MessageResponse } from 'stream-chat';

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
  message: MessageResponse | FormatMessageResponse;
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

  const storableMessage = mapMessageToStorable(message);

  queries.push(
    createUpdateQuery('messages', storableMessage, {
      id: message.id,
    }),
  );

  const storableUsers: Array<ReturnType<typeof mapUserToStorable>> = [];

  if (message.user) {
    const storableUser = mapUserToStorable(message.user);
    storableUsers.push(storableUser);
    queries.push(createUpsertQuery('users', storableUser));
  }

  queries.push(
    createDeleteQuery('reactions', {
      messageId: message.id,
    }),
  );

  const latestReactions = message.latest_reactions || [];
  const ownReactions = message.own_reactions || [];

  const storableReactions: Array<ReturnType<typeof mapReactionToStorable>> = [];

  [...latestReactions, ...ownReactions].forEach((r) => {
    if (r.user) {
      const storableUser = mapUserToStorable(r.user);
      storableUsers.push(storableUser);
      queries.push(createUpsertQuery('users', storableUser));
    }

    const storableReaction = mapReactionToStorable(r);
    storableReactions.push(storableReaction);
    queries.push(createUpsertQuery('reactions', storableReaction));
  });

  QuickSqliteClient.logger?.('info', 'updateMessage', {
    message: storableMessage,
    reactions: storableReactions,
    users: storableUsers,
  });

  if (flush) {
    QuickSqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
