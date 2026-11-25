import type { DBInsertMessageMarkType } from 'stream-chat';

import { mapMessageMarkToStorable } from '../mappers/mapMessageMarkToStorable';
import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { createUpsertQueryIfParentExists } from '../sqlite-utils/createUpsertQueryIfParentExists';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

/**
 * Stores a new mark: its row, the user who made it, and the message's mark summaries
 * (`markGroups`, `ownMarks`), without rewriting the rest of the message.
 */
export const insertMessageMark = async ({
  execute = true,
  mark,
  message,
  user,
}: DBInsertMessageMarkType) => {
  const queries: PreparedQueries[] = [];

  if (user) {
    queries.push(createUpsertQuery('users', mapUserToStorable(user)));
  }

  const storableMark = mapMessageMarkToStorable(mark);

  // A mark can arrive for a message this database never held (only a channel's recent window is
  // cached). Writing it would violate the `messageMarks.messageId` foreign key and abort the whole
  // batch.
  queries.push(
    createUpsertQueryIfParentExists('messageMarks', storableMark, {
      column: 'id',
      table: 'messages',
      value: mark.message_id,
    }),
  );

  const { markGroups, ownMarks } = mapMessageToStorable(message);
  const summaries = {
    ...(markGroups !== undefined ? { markGroups } : {}),
    ...(ownMarks !== undefined ? { ownMarks } : {}),
  };
  if (Object.keys(summaries).length) {
    queries.push(createUpdateQuery('messages', summaries, { id: mark.message_id }));
  }

  SqliteClient.logger?.('info', 'insertMessageMark', {
    execute,
    mark: storableMark,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
