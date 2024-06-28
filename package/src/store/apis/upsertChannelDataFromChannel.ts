import type { Channel } from 'stream-chat';

import { DefaultStreamChatGenerics } from '../../types/types';
import { mapChannelToStorable } from '../mappers/mapChannelToStorable';
import { SqliteClient } from '../SqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';

export const upsertChannelDataFromChannel = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
  flush = true,
}: {
  channel: Channel<StreamChatGenerics>;
  flush?: boolean;
}) => {
  const storableChannel = mapChannelToStorable(channel);
  if (!storableChannel) return;
  const query = createUpsertQuery('channels', storableChannel);
  if (flush) {
    SqliteClient.executeSqlBatch([query]);
  }

  return [query];
};
