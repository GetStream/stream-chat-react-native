import type { ChannelAPIResponse } from 'stream-chat';

import { getChannelMessages } from './getChannelMessages';
import { getMembers } from './getMembers';
import { getReads } from './getReads';
import { selectChannels } from './queries/selectChannels';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapStorableToChannel } from '../mappers/mapStorableToChannel';
import { SqliteClient } from '../SqliteClient';

/**
 * Returns the list of channels with state enriched for given channel ids.
 *
 * @param {Object} param
 * @param {Array} param.channelIds List of channel ids to fetch.
 * @param {Array} param.currentUserId Id of the current logged in user.
 *
 * @returns {Array} Channels with enriched state.
 */
export const getChannels = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channelIds,
  currentUserId,
}: {
  channelIds: string[];
  currentUserId: string;
}): Promise<Omit<ChannelAPIResponse<StreamChatGenerics>, 'duration'>[]> => {
  SqliteClient.logger?.('info', 'getChannels', { channelIds, currentUserId });
  const channels = await selectChannels({ channelIds });

  const cidVsMembers = await getMembers<StreamChatGenerics>({ channelIds });
  const cidVsReads = await getReads<StreamChatGenerics>({ channelIds });
  const cidVsMessages = await getChannelMessages<StreamChatGenerics>({
    channelIds,
    currentUserId,
  });

  // Enrich the channels with state
  return channels.map((c) => ({
    ...mapStorableToChannel<StreamChatGenerics>(c),
    members: cidVsMembers[c.cid] || [],
    messages: cidVsMessages[c.cid] || [],
    pinned_messages: [],
    read: cidVsReads[c.cid] || [],
  }));
};
