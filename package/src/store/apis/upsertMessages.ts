import type { MessageResponse } from 'stream-chat';

import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertMessages = ({
  flush = true,
  messages,
}: {
  messages: MessageResponse[];
  flush?: boolean;
}) => {
  const storableMessages: Array<ReturnType<typeof mapMessageToStorable>> = [];
  const storableUsers: Array<ReturnType<typeof mapUserToStorable>> = [];
  const storableReactions: Array<ReturnType<typeof mapReactionToStorable>> = [];

  messages?.forEach((message: MessageResponse) => {
    storableMessages.push(mapMessageToStorable(message));
    if (message.user) {
      storableUsers.push(mapUserToStorable(message.user));
    }
    [...(message.latest_reactions || []), ...(message.own_reactions || [])].forEach((r) => {
      if (r.user) {
        storableUsers.push(mapUserToStorable(r.user));
      }
      storableReactions.push(mapReactionToStorable(r));
    });
  });

  const finalQueries = [
    ...storableMessages.map((storableMessage) => createUpsertQuery('messages', storableMessage)),
    ...storableUsers.map((storableUser) => createUpsertQuery('users', storableUser)),
    ...storableReactions.map((storableReaction) =>
      createUpsertQuery('reactions', storableReaction),
    ),
  ];

  SqliteClient.logger?.('info', 'upsertMessages', {
    flush,
    messages: storableMessages,
    reactions: storableReactions,
    users: storableUsers,
  });

  if (flush) {
    SqliteClient.executeSqlBatch(finalQueries);
  }

  return finalQueries;
};
