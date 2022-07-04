import type { PreparedQueries, StorableDatabaseRow, Table } from '../types';

export const createUpdateQuery = (
  table: Table,
  set: Partial<StorableDatabaseRow>,
  whereCondition: Partial<StorableDatabaseRow>,
) => {
  const fields = Object.keys(set).map((key) => `${key} = ?`);
  const where = Object.keys(whereCondition).map((key) => `${key} = ?`);
  console.log(`UPDATE ${table}
  SET ${fields.join(', ')}
  WHERE ${where.join(' AND ')}`);
  return [
    `UPDATE ${table}
    SET ${fields.join(',')}
    WHERE ${where.join(' AND ')}`,
    [...Object.values(set), ...Object.values(whereCondition)],
  ] as PreparedQueries;
};
