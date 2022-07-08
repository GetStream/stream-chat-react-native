import { QuickSqliteClient } from '../../QuickSqliteClient';
import { createSelectQuery } from '../../sqlite-utils/createSelectQuery';
import type { JoinedChannelRow } from '../../types';

export const selectChannels = ({
  channelIds,
}: { channelIds?: string[] } = {}): JoinedChannelRow[] => {
  const query = createSelectQuery('channels', ['*'], {
    cid: channelIds,
  });

  const result = QuickSqliteClient.executeSql.apply(null, query);

  if (channelIds) {
    return result.sort((a, b) => channelIds.indexOf(a.cid) - channelIds.indexOf(b.cid));
  } else {
    return result;
  }
};
