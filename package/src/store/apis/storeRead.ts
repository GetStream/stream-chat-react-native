import type { ReadResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapReadToStorable } from '../mappers/mapReadToStorable';
import { createInsertQuery } from '../utils/createInsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const storeRead = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  cid,
  read,
}: {
  cid: string;
  read: ReadResponse<StreamChatGenerics>;
}) => {
  const query = createInsertQuery(
    'reads',
    mapReadToStorable({
      cid,
      read,
    }),
  );
  executeQueries([query]);
};
