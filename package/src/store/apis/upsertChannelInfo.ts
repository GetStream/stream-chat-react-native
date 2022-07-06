import type { ChannelResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapChannelInfoToStorable } from '../mappers/mapChannelInfoToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';

export const upsertChannelInfo = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
}: {
  channel: ChannelResponse<StreamChatGenerics>;
}) => {
  const query = createUpsertQuery('channels', mapChannelInfoToStorable(channel));
  QuickSqliteClient.executeSqlBatch([query]);
};
