import { DB_NAME } from '../../constants';
import { schema } from '../../schema';
import type { JoinedReadRow, ReadRow } from '../../types';

export const getReadsForChannels = (cids: string[]): JoinedReadRow[] => {
  const questionMarks = cids.map((c) => '?').join(',');
  const readsColumnNames = Object.keys(schema.reads).map((name) => `a.${name} as ${name}`);
  const userColumnNames = Object.keys(schema.users).map((name) => `b.${name} as user__${name}`);
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
