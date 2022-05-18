/* eslint-disable no-underscore-dangle */
import type { ReactionResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { DB_NAME } from '../constants';
import { mapStorableToReaction } from '../mappers/mapStorableToReaction';
import type { ReactionRow } from '../types';
import { openDB } from '../utils/openDB';

export const getReactionsForMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  messageId: string,
): ReactionResponse<StreamChatGenerics>[] => {
  openDB();
  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT * FROM reactions WHERE messageId = ?`,
    [messageId],
  );

  if (status === 1) {
    console.error(`Querying for channels failed: ${message}`);
  }

  const result: ReactionRow[] = rows ? rows._array : [];

  return result.map((reactionRow: ReactionRow) =>
    mapStorableToReaction<StreamChatGenerics>(reactionRow),
  );
};
