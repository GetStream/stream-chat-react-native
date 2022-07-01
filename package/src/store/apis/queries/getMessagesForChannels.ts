import { DB_NAME } from '../../constants';
import type { MessageRow } from '../../types';

export const getMessagesForChannels = (cids: string[]): MessageRow[] => {
  const questionMarks = cids.map((c) => '?').join(',');
  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT * FROM messages WHERE cid in (${questionMarks}) ORDER BY datetime(createdAt) DESC`,
    cids,
  );

  if (status === 1) {
    console.error(`Querying for channels failed: ${message}`);
  }

  return rows ? rows._array : [];
};
