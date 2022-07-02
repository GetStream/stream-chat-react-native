import type { DefaultStreamChatGenerics } from 'src/types/types';
import type { ChannelAPIResponse } from 'stream-chat';

import { mapStorableToChannel } from '../../mappers/mapStorableToChannel';
import { selectQuery } from '../../utils/selectQuery';

export const getChannelsForChannelIds = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channelIds: string[],
): Omit<ChannelAPIResponse<StreamChatGenerics>, 'duration' | 'messages' | 'read' | 'members'>[] => {
  const questionMarks = Array(channelIds.length).fill('?').join(',');
  const result = selectQuery(
    `SELECT * FROM channels WHERE cid IN (${questionMarks})`,
    [...channelIds],
    'query channels for channel ids',
  );

  return result
    .map((channelRow) => ({
      ...mapStorableToChannel<StreamChatGenerics>(channelRow),
    }))
    .sort((a, b) => channelIds.indexOf(a.channel.cid) - channelIds.indexOf(b.channel.cid));
};
