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
  const query = createUpsertQuery('channels', mapChannelDataToStorable(channel));
  if (flush) {
    QuickSqliteClient.executeSqlBatch([query]);
  }

  return [query];
};
