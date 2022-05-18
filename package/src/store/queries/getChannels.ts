import type { DefaultStreamChatGenerics } from 'src/types/types';
import type { ChannelAPIResponse } from 'stream-chat';

import { getChannelIdsForQuery } from './getChannelIdsForQuery';
import { getChannelsForChannelIds } from './getChannelsForChannelIds';
import { getMessagesForChannel } from './getMessagesForChannel';

import { closeDB } from '../utils/closeDB';
import { openDB } from '../utils/openDB';

export const getChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  query: string,
): Omit<ChannelAPIResponse<StreamChatGenerics>, 'duration'>[] => {
  if (!query) {
    console.warn('Please provide the query (filters/sort) to fetch channels from DB');
    return [];
  }

  openDB();

  const timeStart = new Date().getTime();
  const channelIds = getChannelIdsForQuery(query);
  const channels = getChannelsForChannelIds<StreamChatGenerics>(channelIds);
  // sort the channels as per channel ids
  channels.sort((a, b) => channelIds.indexOf(a.channel.cid) - channelIds.indexOf(b.channel.cid));

  const result = channels.map((c) => ({
    ...c,
    messages: getMessagesForChannel<StreamChatGenerics>(c.channel.cid),
  }));
  const timeEnd = new Date().getTime();

  console.log('>> PERFORMANCE: getChannels() - time: ', timeEnd - timeStart)
  closeDB();

  return result;
};
