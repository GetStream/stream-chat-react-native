import type { MessageResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import type { PreparedQueries } from '../types';
import { createUpdateQuery } from '../utils/createUpdateQuery';
import { createUpsertQuery } from '../utils/createUpsertQuery';
import { executeQueries } from '../utils/executeQueries';
import { selectQuery } from '../utils/selectQuery';

export const updateMessages = <
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
    messagesToUpsert.push(createUpdateQuery('messages', mapMessageToStorable(message)));
    if (message.user) {
      usersToUpsert.push(createUpsertQuery('users', mapUserToStorable(message.user)));
    }

    [...(message.latest_reactions || []), ...(message.own_reactions || [])].forEach((r) => {
      if (r.user) {
        usersToUpsert.push(createUpsertQuery('users', mapUserToStorable(r.user)));
      }

      reactionsToUpsert.push(
        createUpsertQuery('reactions', mapReactionToStorable<StreamChatGenerics>(r)),
      );
    });
  });

  const finalQueries = [...messagesToUpsert, ...reactionsToUpsert, ...usersToUpsert];

  if (flush) {
    executeQueries(finalQueries);

    setTimeout(() => {
      const result = selectQuery('select type from reactions where messageId = ?', [
        messages[0].id,
      ]);
      console.log(result);
    }, 2000);
  }

  return finalQueries;
};
