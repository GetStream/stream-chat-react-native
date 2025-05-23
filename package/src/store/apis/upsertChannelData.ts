import type { ChannelResponse } from 'stream-chat';

import { mapChannelDataToStorable } from '../mappers/mapChannelDataToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertChannelData = async ({
  channel,
  execute = true,
}: {
  channel: ChannelResponse;
  execute?: boolean;
}) => {
  const storableChannel = mapChannelDataToStorable(channel);
  const query = createUpsertQuery('channels', storableChannel);
  SqliteClient.logger?.('info', 'upsertChannelData', {
    channel: storableChannel,
    execute,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch([query]);
  }

  return [query];
};
