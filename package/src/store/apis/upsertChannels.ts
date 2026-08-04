import type { ChannelMemberResponse, ChannelStateResponseFields } from 'stream-chat';

import { upsertDraft } from './upsertDraft';
import { upsertLocation } from './upsertLocation';
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
  channels: ChannelStateResponseFields[];
  execute?: boolean;
  isLatestMessagesSet?: boolean;
}) => {
  // Update the database only if the query is provided.
  let queries: PreparedQueries[] = [];

  const channelIds = channels.map((channel) => channel.channel?.cid);

  SqliteClient.logger?.('info', 'upsertChannels', {
    channelIds,
  });

  for (const channel of channels) {
    const channelData = channel.channel;
    if (!channelData) {
      continue;
    }
    queries.push(createUpsertQuery('channels', mapChannelDataToStorable(channelData)));

    const { active_live_locations, draft, members, membership, messages, read } = channel;
    if (
      membership &&
      !members.some((m: ChannelMemberResponse) => m.user?.id === membership.user?.id)
    ) {
      members.push({ ...membership, user_id: membership.user?.id });
    }

    if (active_live_locations && active_live_locations.length > 0) {
      active_live_locations.forEach(async (location) => {
        queries = queries.concat(
          await upsertLocation({
            execute: false,
            location,
          }),
        );
      });
    }

    if (draft) {
      queries = queries.concat(await upsertDraft({ draft, execute: false }));
    }

    queries = queries.concat(
      await upsertMembers({
        cid: channelData.cid,
        execute: false,
        members,
      }),
    );

    if (read) {
      queries = queries.concat(
        await upsertReads({
          cid: channelData.cid,
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
