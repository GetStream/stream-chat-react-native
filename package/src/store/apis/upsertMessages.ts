import type { MessageResponse } from 'stream-chat';

import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapPollToStorable } from '../mappers/mapPollToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';

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
  const storablePolls: Array<ReturnType<typeof mapPollToStorable>> = [];

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

  QuickSqliteClient.logger?.('info', 'upsertMessages', {
    flush,
    messages: storableMessages,
    polls: storablePolls,
    reactions: storableReactions,
    users: storableUsers,
  });

  if (flush) {
    QuickSqliteClient.executeSqlBatch(finalQueries);
  }

  return finalQueries;
};
