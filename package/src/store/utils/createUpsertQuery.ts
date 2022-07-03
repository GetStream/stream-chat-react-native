import { tables } from '../schema';
import type { PreparedQueries, StorableDatabaseRow, Table } from '../types';

export const createUpsertQuery = (table: Table, row: StorableDatabaseRow) => {
  const fields = Object.keys(row);

  const questionMarks = Array(Object.keys(fields).length).fill('?').join(',');

  const conflictMatchersWithoutPK = fields
    .filter((f) => f !== tables[table].primaryKey)
    .map((f) => `${f}=excluded.${f}`);

  return [
    `INSERT INTO ${table} (${fields.join(',')}) VALUES (${questionMarks})
    ON CONFLICT(${tables[table].primaryKey}) DO UPDATE SET
      ${conflictMatchersWithoutPK.join(',')};`,
    Object.values(row),
  ] as PreparedQueries;
};
