import type { MessageResponse } from 'stream-chat';

import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { PreparedQueries } from '../types';

export const upsertMessages = ({
  flush = true,
  messages,
  onNonExistentChannel,
}: {
  messages: MessageResponse[];
  flush?: boolean;
  /**
   * Callback to be called when a message is received for a non-existent channel.
   * This can happen when a channel is hidden and a new message comes in.
   * In this case, the channel should be re-added to the database and then the message should be added.
   * **Note**: This callback is to be called with a map of channel cid to the queries that should be executed for that channel
   */
  onNonExistentChannel?: (map: Map<string, PreparedQueries[]>) => void;
}) => {
  const storableMessages: Array<ReturnType<typeof mapMessageToStorable>> = [];
  const storableUsers: Array<ReturnType<typeof mapUserToStorable>> = [];
  const storableReactions: Array<ReturnType<typeof mapReactionToStorable>> = [];

  const usersToUpsert: PreparedQueries[] = [];
  const messagesToUpsert: PreparedQueries[] = [];
  const reactionsToUpsert: PreparedQueries[] = [];

  const nonExistentChannelQueriesMap = new Map<string, PreparedQueries[]>();

  messages.forEach((message) => {
    let storableMessage = mapMessageToStorable(message);
    storableMessages.push(storableMessage);
    const messageQuery = createUpsertQuery('messages', storableMessage);
    const userQueries: PreparedQueries[] = [];
    if (message.user) {
      const userStorable = mapUserToStorable(message.user);
      storableUsers.push(userStorable);
      userQueries.push(createUpsertQuery('users', userStorable));
    }
    const reactionsQueries: PreparedQueries[] = [];
    [...(message.latest_reactions || []), ...(message.own_reactions || [])].forEach((r) => {
      if (r.user) {
        const reactionUserStorable = mapUserToStorable(r.user);
        storableUsers.push(reactionUserStorable);
        userQueries.push(createUpsertQuery('users', reactionUserStorable));
      }
      const reactionStorable = mapReactionToStorable(r);
      storableReactions.push(reactionStorable);
      reactionsQueries.push(createUpsertQuery('reactions', reactionStorable));
    });

    if (message.cid) {
      const channels = QuickSqliteClient.executeSql.apply(
        null,
        createSelectQuery('channels', ['cid'], {
          cid: message.cid,
        }),
      );

      if (channels.length === 0) {
        // channel was not present and a new message came so we must re-add the channel first
        const skipped = [messageQuery, ...userQueries, ...reactionsQueries];
        storableMessage = Object.assign({ skipped: true }, storableMessage);
        const previousQueries = nonExistentChannelQueriesMap.get(message.cid) ?? [];
        nonExistentChannelQueriesMap.set(message.cid, previousQueries.concat(skipped));
        return;
      }
    }

    messagesToUpsert.push(messageQuery);
    usersToUpsert.push(...userQueries);
    reactionsToUpsert.push(...reactionsQueries);
  });

  QuickSqliteClient.logger?.('info', 'upsertMessages', {
    flush,
    messages: storableMessages,
    reactions: storableReactions,
    users: storableUsers,
  });

  // note: the order is important here.. messages, users should be inserted first and then reactions.
  // As reactions have foreign key constraints to messages and users.
  const finalQueries = [...messagesToUpsert, ...usersToUpsert, ...reactionsToUpsert];

  onNonExistentChannel?.(nonExistentChannelQueriesMap);

  if (flush) {
    QuickSqliteClient.executeSqlBatch(finalQueries);
  }

  return finalQueries;
};
