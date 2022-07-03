import type { ReadResponse } from 'stream-chat';

import { selectReadsForChannels } from './queries/selectReadsForChannels';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapStorableToRead } from '../mappers/mapStorableToRead';

export const getReads = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channelIds,
}: {
  channelIds: string[];
}) => {
  const reads = selectReadsForChannels(channelIds);
  const cidVsReads: Record<string, ReadResponse<StreamChatGenerics>[]> = {};

  reads.forEach((read) => {
    if (!cidVsReads[read.cid]) {
      cidVsReads[read.cid] = [];
    }
    cidVsReads[read.cid].push(mapStorableToRead<StreamChatGenerics>(read));
  });

  return cidVsReads;
};
