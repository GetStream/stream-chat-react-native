import type { ReadResponse } from 'stream-chat';

import { getReadsForChannels } from './queries/getReadsForChannels';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapStorableToRead } from '../mappers/mapStorableToRead';

export const getReads = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channelIds: string[],
) => {
  const reads = getReadsForChannels(channelIds);
  const cidVsReads: Record<string, ReadResponse<StreamChatGenerics>[]> = {};

  reads.forEach((read) => {
    if (!cidVsReads[read.cid]) {
      cidVsReads[read.cid] = [];
    }
    cidVsReads[read.cid].push(mapStorableToRead<StreamChatGenerics>(read));
  });

  return cidVsReads;
};
