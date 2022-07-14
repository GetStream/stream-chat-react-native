import type { ChannelResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapChannelDataToStorable } from '../mappers/mapChannelDataToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';

export const upsertChannelData = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
  flush = true,
}: {
  channel: ChannelResponse<StreamChatGenerics>;
  flush?: boolean;
}) => {
  const query = createUpsertQuery('channels', mapChannelDataToStorable(channel));
  if (flush) {
    QuickSqliteClient.executeSqlBatch([query]);
  }

  return [query];
};
