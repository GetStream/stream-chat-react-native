import { QuickSqliteClient } from '../../QuickSqliteClient';
import type { JoinedChannelRow } from '../../types';

export const selectChannelsForChannelIds = ({
  channelIds,
}: {
  channelIds: string[];
}): JoinedChannelRow[] => {
  const questionMarks = Array(channelIds.length).fill('?').join(',');
  const result = QuickSqliteClient.selectQuery(
    `SELECT * FROM channels WHERE cid IN (${questionMarks})`,
    [...channelIds],
  );

  return result.sort((a, b) => channelIds.indexOf(a.cid) - channelIds.indexOf(b.cid));
};
