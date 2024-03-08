import type { ChannelResponse } from 'stream-chat';

import { mapChannelDataToStorable } from '../mappers/mapChannelDataToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
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
  QuickSqliteClient.logger?.('info', 'upsertChannelData', {
    channel: storableChannel,
    flush,
  });
  if (flush) {
    QuickSqliteClient.executeSqlBatch([query]);
  }

  return [query];
};
