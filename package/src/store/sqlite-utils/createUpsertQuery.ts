import { Schema, tables } from '../schema';
import type { PreparedQueries, TableColumnNames, TableRow } from '../types';

export const createUpsertQuery = <T extends keyof Schema>(
  table: T,
  row: Partial<TableRow<T>>,
  conflictCheckKeys?: Array<TableColumnNames<T>>,
) => {
  const filteredRow: typeof row = {};

  for (const key in row) {
    if (row[key] !== undefined) {
      filteredRow[key] = row[key];
    }
  }
  const fields = Object.keys(filteredRow) as (keyof typeof row)[];

  const questionMarks = Array(Object.keys(fields).length).fill('?').join(',');
  const conflictKeys = conflictCheckKeys || tables[table].primaryKey;
  const conflictMatchersWithoutPK = fields
    .filter((f) => !conflictKeys.includes(f))
    // @ts-ignore
    .map((f) => `${f}=excluded.${f}`);

  const conflictConstraint =
    conflictKeys.length > 0
      ? `ON CONFLICT(${conflictKeys.join(',')}) DO UPDATE SET
  ${conflictMatchersWithoutPK.join(',')}`
      : '';

  return [
    `INSERT INTO ${table} (${fields.join(',')}) VALUES (${questionMarks}) ${conflictConstraint}`,
    Object.values(filteredRow),
  ] as PreparedQueries;
};
