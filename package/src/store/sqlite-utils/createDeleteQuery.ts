import type { PreparedQueries, StorableDatabaseRow, Table } from '../types';

export const createDeleteQuery = (table: Table, whereCondition: Partial<StorableDatabaseRow>) => {
  const where = Object.keys(whereCondition).map((key) => `${key} = ?`);

  return [
    `DELETE FROM ${table}
    WHERE ${where.join(' AND ')}`,
    [...Object.values(whereCondition)],
  ] as PreparedQueries;
};
