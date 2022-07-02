import type { ChannelAPIResponse } from 'stream-chat';

import { storeChannel } from './storeChannel';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { PreparedQueries } from '../types';
import { createInsertQuery } from '../utils/createInsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const storeChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channels,
  filterAndSort,
}: {
  channels: ChannelAPIResponse<StreamChatGenerics>[];
  filterAndSort?: string;
}) => {
  // Update the database only if the query is provided.
  const queries: PreparedQueries[] = [];

  if (filterAndSort) {
    const channelIds = channels.map((channel) => channel.channel.cid);
    queries.push(
      createInsertQuery('queryChannelsMap', {
        cids: JSON.stringify(channelIds),
        id: filterAndSort,
      }),
    );
  }

  for (const channel of channels) {
    storeChannel({
      batchedQueries: queries,
      channel,
    });
  }

  executeQueries(queries);
};
