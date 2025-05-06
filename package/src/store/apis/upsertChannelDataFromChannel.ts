import type { Channel } from 'stream-chat';

import { mapChannelToStorable } from '../mappers/mapChannelToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertChannelDataFromChannel = async ({
  channel,
  flush = true,
}: {
  channel: Channel;
  flush?: boolean;
}) => {
  const storableChannel = mapChannelToStorable(channel);
  if (!storableChannel) {
    return;
  }
  const query = createUpsertQuery('channels', storableChannel);
  if (flush) {
    await SqliteClient.executeSqlBatch([query]);
  }

  return [query];
};
