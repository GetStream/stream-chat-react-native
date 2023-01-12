import { QuickSqliteClient } from '../../QuickSqliteClient';
import { createSelectQuery } from '../../sqlite-utils/createSelectQuery';
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

  const result = QuickSqliteClient.executeSql.apply(null, query);

  if (channelIds) {
    return result.sort(
      (a: { cid: string }, b: { cid: string }) =>
        channelIds.indexOf(a.cid) - channelIds.indexOf(b.cid),
    );
  } else {
    return result;
  }
};
