import type { Channel } from 'stream-chat';

import { DefaultStreamChatGenerics } from '../../types/types';
import { mapChannelToStorable } from '../mappers/mapChannelToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertChannelDataFromChannel = async <
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
    await SqliteClient.executeSqlBatch([query]);
  }

  return [query];
};
