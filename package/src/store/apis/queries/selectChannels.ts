import { createSelectQuery } from '../../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../../SqliteClient';
import type { TableRowJoinedUser } from '../../types';

export const selectChannels = ({
  channelIds,
}: { channelIds?: string[] } = {}): TableRowJoinedUser<'channels'>[] => {
  const query = createSelectQuery(
    'channels',
    ['*'],
    channelIds
      ? {
          cid: channelIds,
        }
      : undefined,
  );

  SqliteClient.logger?.('info', 'selectChannels', {
    channelIds,
  });

  const result = SqliteClient.executeSql.apply(null, query);

  if (channelIds) {
    return result.sort(
      (a: { cid: string }, b: { cid: string }) =>
        channelIds.indexOf(a.cid) - channelIds.indexOf(b.cid),
    );
  } else {
    return result;
  }
};
