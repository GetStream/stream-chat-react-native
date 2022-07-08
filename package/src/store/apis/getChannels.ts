import type { DefaultStreamChatGenerics } from 'src/types/types';
import type { ChannelAPIResponse, ChannelFilters, ChannelSort } from 'stream-chat';

import { getMessages } from './getChannelMessages';
import { getMembers } from './getMembers';
import { getReads } from './getReads';
import { selectChannelIdsForFilterSort } from './queries/selectChannelIdsForFilterSort';
import { selectChannels } from './queries/selectChannels';

import { mapStorableToChannel } from '../mappers/mapStorableToChannel';

export const getChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  currentUserId,
  filters,
  sort,
}: {
  currentUserId: string;
  filters?: ChannelFilters<StreamChatGenerics>;
  sort?: ChannelSort<StreamChatGenerics>;
}): Omit<ChannelAPIResponse<StreamChatGenerics>, 'duration'>[] => {
  if (!filters && !sort) {
    console.warn('Please provide the query (filters/sort) to fetch channels from DB');
    return [];
  }

  const channelIds = selectChannelIdsForFilterSort({ filters, sort });
  const channels = selectChannels({ channelIds });

  const timeStart = new Date().getTime();
  const cidVsMembers = getMembers<StreamChatGenerics>({ channelIds });
  const cidVsReads = getReads<StreamChatGenerics>({ channelIds });
  const cidVsMessages = getMessages<StreamChatGenerics>({ channelIds, currentUserId });

  // Enrich the channels with state
  const result = channels.map((c) => ({
    ...mapStorableToChannel<StreamChatGenerics>(c),
    members: cidVsMembers[c.cid],
    messages: cidVsMessages[c.cid],
    read: cidVsReads[c.cid],
  }));

  const timeEnd = new Date().getTime();
  console.log('>> PERFORMANCE query 1: getChannels() - time: ', timeEnd - timeStart);

  return result;
};
