import type { PreparedQueries, StorableDatabaseRow, Table } from '../types';

export const createInsertQuery = (table: Table, row: StorableDatabaseRow) => {
  const fields = Object.keys(row);

  const questionMarks = Array(Object.keys(fields).length).fill('?').join(',');

  const conflictMatchersWithoutPK = fields
    .filter((f) => f !== 'id')
    .map((f) => `${f}=excluded.${f}`);

  return [
    `INSERT INTO ${table} (${fields.join(',')}) VALUES (${questionMarks})
    ON CONFLICT(id) DO UPDATE SET
      ${conflictMatchersWithoutPK.join(',')};`,
    Object.values(row),
  ] as PreparedQueries;
};
