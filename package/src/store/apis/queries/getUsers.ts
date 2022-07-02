import { DB_NAME } from '../../constants';
import type { UserRow } from '../../types';

export const getUsers = (userIds: string[]): UserRow[] => {
  const questionMarks = userIds.map((c) => '?').join(',');
  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT * FROM users WHERE id in (${questionMarks})`,
    userIds,
  );

  if (status === 1) {
    console.error(`Querying for reads failed: ${message}`);
  }

  return rows ? rows._array : [];
};
