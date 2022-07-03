import type { PreparedQueries, StorableDatabaseRow, Table } from '../types';

export const createUpdateQuery = (table: Table, row: StorableDatabaseRow) => {
  const fields = Object.keys(row).map((key) => `${key} = ?`);
  return [
    `UPDATE ${table}
    SET ${fields.join(',')}
    WHERE id = ?`,
    [...Object.values(row), row.id],
  ] as PreparedQueries;
};
