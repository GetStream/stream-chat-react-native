import type { MessageResponse } from 'stream-chat';
import { getChannels } from '../apis';
import { mapChannelDataToStorable } from '../mappers/mapChannelDataToStorable';

import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { PreparedQueries } from '../types';

export const upsertMessages = ({
  flush = true,
  messages,
}: {
  messages: MessageResponse[];
  flush?: boolean;
}) => {
  const channelsToUpsert: PreparedQueries[] = [];
  const usersToUpsert: PreparedQueries[] = [];
  const messagesToUpsert: PreparedQueries[] = [];
  const reactionsToUpsert: PreparedQueries[] = [];

  messages?.forEach((message: MessageResponse) => {
    messagesToUpsert.push(createUpsertQuery('messages', mapMessageToStorable(message)));
    if (message.user) {
      usersToUpsert.push(createUpsertQuery('users', mapUserToStorable(message.user)));
      if (message.cid) {
        const channel = getChannels({ channelIds: [message.cid], currentUserId: message.user.id });
        channelsToUpsert.push(
          createUpsertQuery('channels', mapChannelDataToStorable(channel[0].channel)),
        );
      }
    }

    [...(message.latest_reactions || []), ...(message.own_reactions || [])].forEach((r) => {
      if (r.user) {
        usersToUpsert.push(createUpsertQuery('users', mapUserToStorable(r.user)));
      }

      reactionsToUpsert.push(createUpsertQuery('reactions', mapReactionToStorable(r)));
    });
  });

  const finalQueries = [
    ...channelsToUpsert,
    ...usersToUpsert,
    ...reactionsToUpsert,
    ...messagesToUpsert,
  ];

  if (flush) {
    // console.log(finalQueries, QuickSqliteClient.dbName);
    QuickSqliteClient.executeSqlBatch(finalQueries);
  }

  return finalQueries;
};
