import { QuickSqliteClient } from '../../QuickSqliteClient';
import type { JoinedChannelRow } from '../../types';

export const selectChannels = ({
  channelIds,
}: { channelIds?: string[] } = {}): JoinedChannelRow[] => {
  let result = [];
  if (channelIds) {
    const questionMarks = Array(channelIds.length).fill('?').join(',');
    result = QuickSqliteClient.executeSql(
      `SELECT * FROM channels WHERE cid IN (${questionMarks})`,
      [...channelIds],
    );
    return result.sort((a, b) => channelIds.indexOf(a.cid) - channelIds.indexOf(b.cid));
  } else {
    result = QuickSqliteClient.executeSql(`SELECT * FROM channels`, []);
    return result;
  }
};
