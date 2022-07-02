import type { MessageResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import type { PreparedQueries } from '../types';
import { createInsertQuery } from '../utils/createInsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const storeMessages = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  flush = true,
  messages,
}: {
  messages: MessageResponse<StreamChatGenerics>[];
  flush?: boolean;
}) => {
  const usersToUpsert: PreparedQueries[] = [];
  const messagesToUpsert: PreparedQueries[] = [];
  const reactionsToUpsert: PreparedQueries[] = [];

  messages?.forEach((message: MessageResponse<StreamChatGenerics>) => {
    messagesToUpsert.push(createInsertQuery('messages', mapMessageToStorable(message)));
    if (message.user) {
      usersToUpsert.push(createInsertQuery('users', mapUserToStorable(message.user)));
    }

    [...(message.latest_reactions || []), ...(message.own_reactions || [])].forEach((r) => {
      if (r.user) {
        usersToUpsert.push(createInsertQuery('users', mapUserToStorable(r.user)));
      }

      reactionsToUpsert.push(
        createInsertQuery('reactions', mapReactionToStorable<StreamChatGenerics>(r)),
      );
    });
  });

  const finalQueries = [...messagesToUpsert, ...reactionsToUpsert, ...usersToUpsert];

  if (flush) {
    executeQueries(finalQueries);
  }

  return finalQueries;
};
