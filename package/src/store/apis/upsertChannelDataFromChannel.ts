import type { Channel } from 'stream-chat';

import { mapChannelToStorable } from '../mappers/mapChannelToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertChannelDataFromChannel = async ({
  channel,
  execute = true,
}: {
  channel: Channel;
  execute?: boolean;
}) => {
  const storableChannel = mapChannelToStorable(channel);
  if (!storableChannel) {
    return;
  }
  const query = createUpsertQuery('channels', storableChannel);
  if (execute) {
    await SqliteClient.executeSqlBatch([query]);
  }

  return [query];
};
