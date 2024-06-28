import type { ChannelResponse } from 'stream-chat';

import { mapChannelDataToStorable } from '../mappers/mapChannelDataToStorable';
import { SqliteClient } from '../SqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';

export const upsertChannelData = ({
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
    SqliteClient.executeSqlBatch([query]);
  }

  return [query];
};
