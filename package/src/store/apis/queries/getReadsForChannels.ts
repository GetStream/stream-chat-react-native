import { DB_NAME } from '../../constants';
import type { ReadRow } from '../../types';

export const getReadsForChannels = (cids: string[]): ReadRow[] => {
  const questionMarks = cids.map((c) => '?').join(',');
  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT * FROM reads WHERE cid in (${questionMarks})`,
    cids,
  );

  if (status === 1) {
    console.error(`Querying for reads failed: ${message}`);
  }

  return rows ? rows._array : [];
};
