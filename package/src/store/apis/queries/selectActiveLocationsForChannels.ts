import { nowNs } from 'stream-chat';

import { TableRow } from '../../../store/types';
import { SqliteClient } from '../../SqliteClient';

export const selectActiveLocationsForChannels = async (
  cids: string[],
): Promise<TableRow<'locations'>[]> => {
  const questionMarks = Array(cids.length).fill('?').join(',');
  SqliteClient.logger?.('info', 'selectActiveLocationsForChannels', {
    cids,
  });
  // Active means `endAt` is set and still in the future. `endAt` is unix nanoseconds, so the
  // cutoff is `nowNs()` and the comparison is plain numeric.
  const locations = await SqliteClient.executeSql(
    `SELECT * FROM locations WHERE channelCid IN (${questionMarks}) AND endAt IS NOT NULL AND endAt > ?`,
    [...cids, nowNs()],
  );

  return locations as unknown as TableRow<'locations'>[];
};
