import type { ChannelAPIResponse, ChannelMemberResponse } from 'stream-chat';

import { upsertDraft } from './upsertDraft';
import { upsertMembers } from './upsertMembers';

import { upsertMessages } from './upsertMessages';
import { upsertReads } from './upsertReads';

import { mapChannelDataToStorable } from '../mappers/mapChannelDataToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

export const upsertChannels = async ({
  channels,
  execute = true,
  isLatestMessagesSet,
}: {
  channels: ChannelAPIResponse[];
  execute?: boolean;
  isLatestMessagesSet?: boolean;
}) => {
  // Update the database only if the query is provided.
  let queries: PreparedQueries[] = [];

  const channelIds = channels.map((channel) => channel.channel.cid);

  SqliteClient.logger?.('info', 'upsertChannels', {
    channelIds,
  });

  for (const channel of channels) {
    queries.push(createUpsertQuery('channels', mapChannelDataToStorable(channel.channel)));

    const { draft, members, membership, messages, read } = channel;
    if (
      membership &&
      !members.includes((m: ChannelMemberResponse) => m.user?.id === membership.user?.id)
    ) {
      members.push({ ...membership, user_id: membership.user?.id });
    }

    if (draft) {
      queries = queries.concat(await upsertDraft({ draft, execute: false }));
    }

    queries = queries.concat(
      await upsertMembers({
        cid: channel.channel.cid,
        execute: false,
        members,
      }),
    );

    if (read) {
      queries = queries.concat(
        await upsertReads({
          cid: channel.channel.cid,
          execute: false,
          reads: read,
        }),
      );
    }

    if (isLatestMessagesSet) {
      queries = queries.concat(
        await upsertMessages({
          execute: false,
          messages,
        }),
      );
    }
  }

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
