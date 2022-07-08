import { Schema, tables } from '../schema';
import type { PreparedQueries, TableColumnNames, TableRow } from '../types';

export const createUpsertQuery = <T extends keyof Schema>(
  table: T,
  row: Partial<TableRow<T>>,
  conflictCheckKeys?: Array<TableColumnNames<T>>,
) => {
  const fields = Object.keys(row) as (keyof typeof row)[];

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
    Object.values(row),
  ] as PreparedQueries;
};
