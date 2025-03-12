import type { ReadResponse } from 'stream-chat';

import { selectReadsForChannels } from './queries/selectReadsForChannels';

import { mapStorableToRead } from '../mappers/mapStorableToRead';
import { SqliteClient } from '../SqliteClient';

export const getReads = async ({ channelIds }: { channelIds: string[] }) => {
  SqliteClient.logger?.('info', 'getReads', { channelIds });
  const reads = await selectReadsForChannels(channelIds);
  const cidVsReads: Record<string, ReadResponse[]> = {};

  reads.forEach((read) => {
    if (!cidVsReads[read.cid]) {
      cidVsReads[read.cid] = [];
    }
    cidVsReads[read.cid].push(mapStorableToRead(read));
  });

  return cidVsReads;
};
