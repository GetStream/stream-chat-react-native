import type { ChannelResponse } from 'stream-chat';

import { mapChannelDataToStorable } from '../mappers/mapChannelDataToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertChannelData = async ({
  channel,
  flush = true,
}: {
  channel: ChannelResponse;
  flush?: boolean;
}) => {
  const storableChannel = mapChannelDataToStorable(channel);
  const query = createUpsertQuery('channels', storableChannel);
  SqliteClient.logger?.('info', 'upsertChannelData', {
    channel: storableChannel,
    flush,
  });

  if (flush) {
    await SqliteClient.executeSqlBatch([query]);
  }

  return [query];
};
