import type { UserRow } from '../../types';
import { selectQuery } from '../../utils/selectQuery';

export const getUsers = (userIds: string[]): UserRow[] => {
  const questionMarks = userIds.map((c) => '?').join(',');
  const result = selectQuery(
    `SELECT * FROM users WHERE id in (${questionMarks})`,
    userIds,
    'query users',
  );

  return result;
};
