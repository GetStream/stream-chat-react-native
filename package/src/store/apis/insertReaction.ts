import type { LocalMessage, MessageResponse, ReactionResponse } from 'stream-chat';

import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { createUpsertQueryIfParentExists } from '../sqlite-utils/createUpsertQueryIfParentExists';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

export const insertReaction = async ({
  execute = true,
  message,
  reaction,
}: {
  message: MessageResponse | LocalMessage;
  reaction: ReactionResponse;
  execute?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  const storableReaction = mapReactionToStorable(reaction);

  // Only a channel's cached window of messages is stored, so a reaction can arrive for a message
  // this database has never held - an old one someone reacts to, or a `/sync` replay after a cold
  // start. Writing it anyway violates the `reactions.messageId` foreign key and aborts the whole
  // batch it travels in.
  queries.push(
    createUpsertQueryIfParentExists('reactions', storableReaction, {
      column: 'id',
      table: 'messages',
      value: reaction.message_id,
    }),
  );

  const stringifiedNewReactionGroups = JSON.stringify(message.reaction_groups);

  queries.push(
    createUpdateQuery(
      'messages',
      {
        reactionGroups: stringifiedNewReactionGroups,
      },
      { id: reaction.message_id },
    ),
  );

  SqliteClient.logger?.('info', 'insertReaction', {
    execute,
    reaction: storableReaction,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
