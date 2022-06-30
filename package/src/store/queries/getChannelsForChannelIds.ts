/* eslint-disable no-underscore-dangle */
import type { DefaultStreamChatGenerics } from 'src/types/types';
import type { ChannelAPIResponse } from 'stream-chat';

import { getMessagesForChannel } from './getMessagesForChannel';

import { DB_NAME } from '../constants';
import { mapStorableToChannel } from '../mappers/mapStorableToChannel';
import type { ChannelRow } from '../types';

export const getChannelsForChannelIds = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channelIds: string[],
): Omit<ChannelAPIResponse<StreamChatGenerics>, 'duration'>[] => {
  const questionMarks = Array(channelIds.length).fill('?').join(',');
  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT * FROM channels WHERE cid IN (${questionMarks})`,
    [...channelIds],
  );

  if (status === 1) {
    console.error(`Querying for channels failed: ${message}`);
  }

  const result: ChannelRow[] = rows ? rows._array : [];

  return result.map((channelRow) => ({
    ...mapStorableToChannel(channelRow),
    messages: getMessagesForChannel(channelRow.cid),
  }));
};
