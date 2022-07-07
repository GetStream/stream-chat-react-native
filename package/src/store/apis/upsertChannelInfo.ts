import type { ChannelResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapChannelInfoToStorable } from '../mappers/mapChannelInfoToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';

export const upsertChannelInfo = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
  flush = true,
}: {
  channel: ChannelResponse<StreamChatGenerics>;
  flush?: boolean;
}) => {
  const query = createUpsertQuery('channels', mapChannelInfoToStorable(channel));
  if (flush) {
    QuickSqliteClient.executeSqlBatch([query]);
  }

  return [query];
};
