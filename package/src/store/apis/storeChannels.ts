import type { ChannelAPIResponse, ChannelFilters, ChannelSort } from 'stream-chat';

import { storeCidsForQuery } from './storeCidsForQuery';
import { storeMembers } from './storeMembers';

import { storeMessages } from './storeMessages';
import { storeReads } from './storeReads';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { PreparedQueries } from '../types';
import { executeQueries } from '../utils/executeQueries';

export const storeChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channels,
  filters,
  flush = true,
  sort,
}: {
  channels: ChannelAPIResponse<StreamChatGenerics>[];
  filters?: ChannelFilters<StreamChatGenerics>;
  flush?: boolean;
  sort?: ChannelSort<StreamChatGenerics>;
}) => {
  // Update the database only if the query is provided.
  let queries: PreparedQueries[] = [];

  if (filters || sort) {
    const channelIds = channels.map((channel) => channel.channel.cid);
    queries = queries.concat(
      storeCidsForQuery({
        cids: channelIds,
        filters,
        flush: false,
        sort,
      }),
    );
  }

  for (const channel of channels) {
    const { members, messages, read } = channel;

    queries = queries.concat(
      storeMembers({
        cid: channel.channel.cid,
        flush: false,
        members,
      }),
    );

    if (read) {
      queries = queries.concat(
        storeReads({
          cid: channel.channel.cid,
          flush: false,
          reads: read,
        }),
      );
    }

    queries = queries.concat(
      storeMessages({
        flush: false,
        messages,
      }),
    );
  }

  if (flush) {
    executeQueries(queries);
  }

  return queries;
};
