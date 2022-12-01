import type { ChannelAPIResponse } from 'stream-chat';

import { getChannelMessages } from './getChannelMessages';
import { getMembers } from './getMembers';
import { getReads } from './getReads';
import { selectChannels } from './queries/selectChannels';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapStorableToChannel } from '../mappers/mapStorableToChannel';

/**
 * Returns the list of channels with state enriched for given channel ids.
 *
 * @param {Object} param
 * @param {Array} param.channelIds List of channel ids to fetch.
 * @param {Array} param.currentUserId Id of the current logged in user.
 *
 * @returns {Array} Channels with enriched state.
 */
export const getChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channelIds,
  currentUserId,
}: {
  channelIds: string[];
  currentUserId: string;
}): Omit<ChannelAPIResponse<StreamChatGenerics>, 'duration'>[] => {
  const channels = selectChannels({ channelIds });

  const cidVsMembers = getMembers<StreamChatGenerics>({ channelIds });
  const cidVsReads = getReads<StreamChatGenerics>({ channelIds });
  const cidVsMessages = getChannelMessages<StreamChatGenerics>({
    channelIds,
    currentUserId,
  });

  // Enrich the channels with state
  return channels.map((c) => ({
    ...mapStorableToChannel<StreamChatGenerics>(c),
    members: cidVsMembers[c.cid],
    messages: cidVsMessages[c.cid],
    pinned_messages: [],
    read: cidVsReads[c.cid],
  }));
};
