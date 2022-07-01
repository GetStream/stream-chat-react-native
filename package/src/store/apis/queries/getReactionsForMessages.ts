import { DB_NAME } from '../../constants';
import type { ReactionRow } from '../../types';

export const getReactionsForMessages = (messageIds: string[]): ReactionRow[] => {
  const questionMarks = messageIds.map((c) => '?').join(',');
  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT * FROM reactions WHERE messageId in (${questionMarks})`,
    messageIds,
  );

  if (status === 1) {
    console.error(`Querying for reactions failed: ${message}`);
  }

  return rows ? rows._array : [];
};
