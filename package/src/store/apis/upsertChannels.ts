import type { ChannelAPIResponse, ChannelFilters, ChannelSort } from 'stream-chat';

import { upsertCidsForQuery } from './upsertCidsForQuery';
import { upsertMembers } from './upsertMembers';

import { upsertMessages } from './upsertMessages';
import { upsertReads } from './upsertReads';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapChannelToStorable } from '../mappers/mapChannelToStorable';
import type { PreparedQueries } from '../types';
import { createUpsertQuery } from '../utils/createUpsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const upsertChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channels,
  filters,
  flush = true,
  isLatestMessagesSet,
  sort,
}: {
  channels: ChannelAPIResponse<StreamChatGenerics>[];
  filters?: ChannelFilters<StreamChatGenerics>;
  flush?: boolean;
  isLatestMessagesSet?: boolean;
  sort?: ChannelSort<StreamChatGenerics>;
}) => {
  // Update the database only if the query is provided.
  let queries: PreparedQueries[] = [];

  if (filters || sort) {
    const channelIds = channels.map((channel) => channel.channel.cid);
    queries = queries.concat(
      upsertCidsForQuery({
        cids: channelIds,
        filters,
        flush: false,
        sort,
      }),
    );
  }

  for (const channel of channels) {
    queries.push(createUpsertQuery('channels', mapChannelToStorable(channel)));

    const { members, messages, read } = channel;
    queries = queries.concat(
      upsertMembers({
        cid: channel.channel.cid,
        flush: false,
        members,
      }),
    );

    if (read) {
      queries = queries.concat(
        upsertReads({
          cid: channel.channel.cid,
          flush: false,
          reads: read,
        }),
      );
    }

    if (isLatestMessagesSet) {
      queries = queries.concat(
        upsertMessages({
          flush: false,
          messages,
        }),
      );
    }
  }

  if (flush) {
    executeQueries(queries, 'upsertChannels');
  }

  return queries;
};
