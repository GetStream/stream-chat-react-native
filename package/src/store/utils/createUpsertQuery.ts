import { tables } from '../schema';
import type { PreparedQueries, StorableDatabaseRow, Table } from '../types';

export const createUpsertQuery = (
  table: Table,
  row: StorableDatabaseRow,
  conflictCheckKeys?: Array<keyof StorableDatabaseRow>,
) => {
  const fields = Object.keys(row);

  const questionMarks = Array(Object.keys(fields).length).fill('?').join(',');
  const conflictKeys = conflictCheckKeys || tables[table].primaryKey;
  const conflictMatchersWithoutPK = fields
    .filter((f) => !conflictKeys.includes(f))
    .map((f) => `${f}=excluded.${f}`);

  const conflictConstraint =
    conflictKeys.length > 0
      ? `ON CONFLICT(${conflictKeys.join(',')}) DO UPDATE SET
  ${conflictMatchersWithoutPK.join(',')}`
      : '';

  return [
    `INSERT INTO ${table} (${fields.join(',')}) VALUES (${questionMarks}) ${conflictConstraint}`,
    Object.values(row),
  ] as PreparedQueries;
};
