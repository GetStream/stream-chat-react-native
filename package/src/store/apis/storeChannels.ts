import type { ChannelAPIResponse, ChannelFilters, ChannelSort } from 'stream-chat';

import { storeCidsForQuery } from './storeCidsForQuery';
import { storeMembers } from './storeMembers';

import { storeReads } from './storeReads';
import { storeMessages } from './upsertMessages';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapChannelToStorable } from '../mappers/mapChannelToStorable';
import type { PreparedQueries } from '../types';
import { createUpsertQuery } from '../utils/createUpsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const storeChannels = <
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
      storeCidsForQuery({
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

    if (isLatestMessagesSet) {
      queries = queries.concat(
        storeMessages({
          flush: false,
          messages,
        }),
      );
    }
  }

  if (flush) {
    executeQueries(queries);
  }

  return queries;
};
