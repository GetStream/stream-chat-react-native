import type { ReadResponse } from 'stream-chat';

import { selectReadsForChannels } from './queries/selectReadsForChannels';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapStorableToRead } from '../mappers/mapStorableToRead';
import { SqliteClient } from '../SqliteClient';

export const getReads = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channelIds,
}: {
  channelIds: string[];
}) => {
  SqliteClient.logger?.('info', 'getReads', { channelIds });
  const reads = await selectReadsForChannels(channelIds);
  const cidVsReads: Record<string, ReadResponse<StreamChatGenerics>[]> = {};

  reads.forEach((read) => {
    if (!cidVsReads[read.cid]) {
      cidVsReads[read.cid] = [];
    }
    cidVsReads[read.cid].push(mapStorableToRead<StreamChatGenerics>(read));
  });

  return cidVsReads;
};
