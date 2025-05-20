import type { LocalMessage, MessageResponse } from 'stream-chat';

import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapPollToStorable } from '../mappers/mapPollToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertMessages = async ({
  flush = true,
  messages,
}: {
  messages: (MessageResponse | LocalMessage)[];
  flush?: boolean;
}) => {
  const storableMessages: Array<ReturnType<typeof mapMessageToStorable>> = [];
  const storableUsers: Array<ReturnType<typeof mapUserToStorable>> = [];
  const storableReactions: Array<ReturnType<typeof mapReactionToStorable>> = [];
  const storablePolls: Array<ReturnType<typeof mapPollToStorable>> = [];

  messages?.forEach((message: MessageResponse | LocalMessage) => {
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
    if (message.poll) {
      storablePolls.push(mapPollToStorable(message.poll));
    }
  });

  const finalQueries = [
    ...storableMessages.map((storableMessage) => createUpsertQuery('messages', storableMessage)),
    ...storableUsers.map((storableUser) => createUpsertQuery('users', storableUser)),
    ...storableReactions.map((storableReaction) =>
      createUpsertQuery('reactions', storableReaction),
    ),
    ...storablePolls.map((storablePoll) => createUpsertQuery('poll', storablePoll)),
  ];

  SqliteClient.logger?.('info', 'upsertMessages', {
    flush,
    messages: storableMessages,
    polls: storablePolls,
    reactions: storableReactions,
    users: storableUsers,
  });

  if (flush) {
    await SqliteClient.executeSqlBatch(finalQueries);
  }

  return finalQueries;
};
