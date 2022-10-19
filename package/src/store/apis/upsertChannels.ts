import type { ChannelAPIResponse, ChannelFilters, ChannelSort } from 'stream-chat';

import { upsertCidsForQuery } from './upsertCidsForQuery';
import { upsertMembers } from './upsertMembers';

import { upsertMessages } from './upsertMessages';
import { upsertReads } from './upsertReads';

import { mapChannelDataToStorable } from '../mappers/mapChannelDataToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { PreparedQueries } from '../types';

export const upsertChannels = ({
  channels,
  filters,
  flush = true,
  isLatestMessagesSet,
  sort,
}: {
  channels: ChannelAPIResponse[];
  filters?: ChannelFilters;
  flush?: boolean;
  isLatestMessagesSet?: boolean;
  sort?: ChannelSort;
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
    queries.push(createUpsertQuery('channels', mapChannelDataToStorable(channel.channel)));

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
    QuickSqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
