import { TableRow } from '../../../store/types';
import { SqliteClient } from '../../SqliteClient';

export const selectActiveLocationsForChannels = async (
  cids: string[],
): Promise<TableRow<'locations'>[]> => {
  const questionMarks = Array(cids.length).fill('?').join(',');
  SqliteClient.logger?.('info', 'selectActiveLocationsForChannels', {
    cids,
  });
  // Query to select active live locations for the given channel ids where the end_at is not empty and it is greater than the current date.
  const locations = await SqliteClient.executeSql(
    `SELECT * FROM locations WHERE channelCid IN (${questionMarks}) AND endAt IS NOT NULL AND endAt > ?`,
    [...cids, new Date().toISOString()],
  );

  return locations as unknown as TableRow<'locations'>[];
};
