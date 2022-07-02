import { schema } from 'src/store/schema';

import type { ReadResponse } from 'stream-chat';

import { getReadsForChannels } from './queries/getReadsForChannels';

import { DB_NAME } from '../../constants';
import type { ReadRow } from '../../types';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapStorableToRead } from '../mappers/mapStorableToRead';
import type { JoinedReadRow, UserRow } from '../types';
import { mapStorableToUser } from '../mappers/mapStorableToUser';

export const getReads = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  cids: string[],
): ReadRow[] => {
  const joinedReads = getReadsForChannels(cids);
  const reads = joinedReads.map((r) => {
    // @ts-ignore
    const userObject: UserRow = {};
    const readObject: ReadRow = {};

    Object.keys(r).forEach((columnName) => {
      if (columnName.includes('users__')) {
        const columnNameWithPrefix = columnName.substring('users__'.length);
        userObject[columnNameWithPrefix] = r[columnName];
      } else {
        readObject[columnName] = r[columnName];
      }
    });

    return {
      ...mapStorableToRead(readObject),
      user: mapStorableToUser(userObject),
    };
  });

  const cidVsReads: Record<string, ReadResponse<StreamChatGenerics>[]> = {};
  reads.forEach((read) => {
    if (!cidVsReads[read.cid]) {
      cidVsReads[read.cid] = [];
    }
    cidVsReads[read.cid].push(mapStorableToRead(read));
  });
};
