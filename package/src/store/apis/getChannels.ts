import type { ChannelStateResponseFields } from 'stream-chat';

import { getChannelActiveLocations } from './getChannelActiveLocations';
import { getChannelMessages } from './getChannelMessages';
import { getDraftForChannels } from './getDraftsForChannels';
import { getMembers } from './getMembers';
import { getReads } from './getReads';
import { selectChannels } from './queries/selectChannels';

import { mapStorableToChannel } from '../mappers/mapStorableToChannel';
import { SqliteClient } from '../SqliteClient';

/**
 * Returns the channels with the given IDs, including their members, reads, messages, draft and
 * active live locations.
 *
 * @param params.channelIds The channel IDs to fetch.
 * @param params.userId The ID of the current user.
 * @returns The channels with their state.
 */
export const getChannels = async ({
  channelIds,
  userId,
}: {
  channelIds: string[];
  userId: string;
}): Promise<Omit<ChannelStateResponseFields, 'duration'>[]> => {
  SqliteClient.logger?.('info', 'getChannels', { channelIds, userId });

  const [channels, cidVsDraft, cidVsMembers, cidVsReads, cidVsMessages, cidVsActiveLocations] =
    await Promise.all([
      selectChannels({ channelIds }),
      getDraftForChannels({ channelIds, userId }),
      getMembers({ channelIds }),
      getReads({ channelIds }),
      getChannelMessages({
        channelIds,
        userId,
      }),
      getChannelActiveLocations({ channelIds }),
    ]);

  return channels.map((c) => ({
    ...mapStorableToChannel(c),
    active_live_locations: cidVsActiveLocations[c.cid] || [],
    draft: cidVsDraft[c.cid],
    members: cidVsMembers[c.cid] || [],
    membership: (cidVsMembers[c.cid] || []).find((member) => member.user_id === userId),
    messages: cidVsMessages[c.cid] || [],
    pinned_messages: [],
    read: cidVsReads[c.cid] || [],
    threads: [],
  }));
};
