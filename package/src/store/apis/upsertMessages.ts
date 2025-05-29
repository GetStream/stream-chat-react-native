import type { LocalMessage, MessageResponse } from 'stream-chat';

import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapPollToStorable } from '../mappers/mapPollToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertMessages = async ({
  execute = true,
  messages,
}: {
  messages: (MessageResponse | LocalMessage)[];
  execute?: boolean;
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
    execute,
    messages: storableMessages,
    polls: storablePolls,
    reactions: storableReactions,
    users: storableUsers,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch(finalQueries);
  }

  return finalQueries;
};
