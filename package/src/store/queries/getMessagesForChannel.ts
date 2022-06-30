/* eslint-disable no-underscore-dangle */
import type { MessageResponse } from 'stream-chat';

import { getReactionsForMessage } from './getReactionsForMessage';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { DB_NAME } from '../constants';
import { mapStorableToMessage } from '../mappers/mapStorableToMessage';
import type { MessageRow } from '../types';
export const getMessagesForChannel = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channelId: string,
): MessageResponse<StreamChatGenerics>[] => {
  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT * FROM messages WHERE cid = ? ORDER BY datetime(createdAt) DESC`,
    [channelId],
  );

  if (status === 1) {
    console.error(`Querying for channels failed: ${message}`);
  }

  const result: MessageRow[] = rows ? rows._array : [];

  return result.map((messageRow: MessageRow) => {
    const m = mapStorableToMessage<StreamChatGenerics>(messageRow);
    m.latest_reactions = getReactionsForMessage(m.id);
    return m;
  });
};
