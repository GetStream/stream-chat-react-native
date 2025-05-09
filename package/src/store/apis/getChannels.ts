import type { ChannelAPIResponse } from 'stream-chat';

import { getChannelMessages } from './getChannelMessages';
import { getMembers } from './getMembers';
import { getReads } from './getReads';
import { selectChannels } from './queries/selectChannels';

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
export const getChannels = async ({
  channelIds,
  currentUserId,
}: {
  channelIds: string[];
  currentUserId: string;
}): Promise<Omit<ChannelAPIResponse, 'duration'>[]> => {
  SqliteClient.logger?.('info', 'getChannels', { channelIds, currentUserId });
  const channels = await selectChannels({ channelIds });

  const cidVsMembers = await getMembers({ channelIds });
  const cidVsReads = await getReads({ channelIds });
  const cidVsMessages = await getChannelMessages({
    channelIds,
    currentUserId,
  });

  // Enrich the channels with state
  return channels.map((c) => ({
    ...mapStorableToChannel(c),
    members: cidVsMembers[c.cid] || [],
    membership: (cidVsMembers[c.cid] || []).find((member) => member.user_id === currentUserId),
    messages: cidVsMessages[c.cid] || [],
    pinned_messages: [],
    read: cidVsReads[c.cid] || [],
  }));
};
