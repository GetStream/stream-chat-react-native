import { Schema, tables } from '../schema';
import type { PreparedQueries, TableColumnNames, TableRow } from '../types';

/**
 * The pieces every upsert statement is built from, shared with `createUpsertQueryIfParentExists` so
 * both filter columns and resolve conflict keys the same way.
 *
 * @internal
 */
export const upsertStatementParts = <T extends keyof Schema>(
  table: T,
  row: Partial<TableRow<T>>,
  conflictCheckKeys?: Array<TableColumnNames<T>>,
) => {
  const filteredRow: typeof row = {};

  // `DO UPDATE SET` only updates the provided properties. Mappers set unavailable fields to
  // `undefined` (`own_capabilities` is missing from `event.channel`, for example), and writing
  // those would clear the stored values.
  for (const key in row) {
    if (row[key] !== undefined) {
      filteredRow[key] = row[key];
    }
  }
  const fields = Object.keys(filteredRow) as (keyof typeof row)[];

  const questionMarks = Array(Object.keys(fields).length).fill('?').join(',');
  const conflictKeys = conflictCheckKeys || tables[table].primaryKey || [];
  const conflictMatchersWithoutPK: string[] = (fields as string[])
    .filter((f) => !(conflictKeys as string[]).includes(f))
    .map((f) => `${f}=excluded.${f}`);

  const conflictConstraint =
    conflictKeys.length > 0
      ? `ON CONFLICT(${conflictKeys.join(',')}) DO UPDATE SET
  ${conflictMatchersWithoutPK.join(',')}`
      : '';

  return {
    columns: fields.join(','),
    conflictConstraint,
    questionMarks,
    values: Object.values(filteredRow),
  };
};

/**
 * Creates a prepared upsert query. Conflicts are checked on `conflictCheckKeys`, defaulting to the
 * primary key (https://www.sqlite.org/lang_UPSERT.html). `undefined` row values are left out.
 *
 * @param table The table name.
 * @param row The table row to insert or update.
 * @param conflictCheckKeys The columns to check conflicts on. Defaults to the primary key.
 * @returns The prepared query as `[sql, params]`.
 */
export const createUpsertQuery = <T extends keyof Schema>(
  table: T,
  row: Partial<TableRow<T>>,
  conflictCheckKeys?: Array<TableColumnNames<T>>,
): PreparedQueries => {
  const { columns, conflictConstraint, questionMarks, values } = upsertStatementParts(
    table,
    row,
    conflictCheckKeys,
  );

  return [
    `INSERT INTO ${table} (${columns}) VALUES (${questionMarks}) ${conflictConstraint}`,
    values,
  ];
};
