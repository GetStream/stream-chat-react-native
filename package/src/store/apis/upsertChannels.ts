import type { ChannelAPIResponse, ChannelFilters, ChannelSort } from 'stream-chat';

import { upsertCidsForQuery } from './upsertCidsForQuery';
import { upsertMembers } from './upsertMembers';

import { upsertMessages } from './upsertMessages';
import { upsertReads } from './upsertReads';

import { mapChannelDataToStorable } from '../mappers/mapChannelDataToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

export const upsertChannels = async ({
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

  const channelIds = channels.map((channel) => channel.channel.cid);

  SqliteClient.logger?.('info', 'upsertChannels', {
    channelIds,
  });

  if (filters || sort) {
    queries = queries.concat(
      await upsertCidsForQuery({
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
      await upsertMembers({
        cid: channel.channel.cid,
        flush: false,
        members,
      }),
    );

    if (read) {
      queries = queries.concat(
        await upsertReads({
          cid: channel.channel.cid,
          flush: false,
          reads: read,
        }),
      );
    }

    if (isLatestMessagesSet) {
      queries = queries.concat(
        await upsertMessages({
          flush: false,
          messages,
        }),
      );
    }
  }

  if (flush) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
