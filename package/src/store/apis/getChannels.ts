import type { DefaultStreamChatGenerics } from 'src/types/types';
import type { ChannelAPIResponse, ChannelFilters, ChannelSort } from 'stream-chat';

import { getMembers } from './getMembers';
import { getMessages } from './getMessages';
import { getReads } from './getReads';
import { getChannelIdsForFilterSort } from './queries/getChannelIdsForFilterSort';

import { getChannelsForChannelIds } from './queries/getChannelsForChannelIds';

import { closeDB } from '../utils/closeDB';
import { openDB } from '../utils/openDB';

export const getChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  filters?: ChannelFilters<StreamChatGenerics>,
  sort?: ChannelSort<StreamChatGenerics>,
): Omit<ChannelAPIResponse<StreamChatGenerics>, 'duration'>[] => {
  if (!filters && !sort) {
    console.warn('Please provide the query (filters/sort) to fetch channels from DB');
    return [];
  }

  openDB();

  const channelIds = getChannelIdsForFilterSort(filters, sort);
  const channels = getChannelsForChannelIds<StreamChatGenerics>(channelIds);

  const timeStart = new Date().getTime();
  const cidVsMembers = getMembers<StreamChatGenerics>(channelIds);
  const cidVsReads = getReads<StreamChatGenerics>(channelIds);
  const cidVsMessages = getMessages<StreamChatGenerics>(channelIds);

  // Enrich the channels with state
  const result = channels.map((c) => ({
    ...c,
    members: cidVsMembers[c.channel.cid],
    messages: cidVsMessages[c.channel.cid],
    read: cidVsReads[c.channel.cid],
  }));

  const timeEnd = new Date().getTime();
  console.log('>> PERFORMANCE query 1: getChannels() - time: ', timeEnd - timeStart);
  closeDB();

  return result;
};
