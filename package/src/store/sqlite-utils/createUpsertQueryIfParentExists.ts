import { upsertStatementParts } from './createUpsertQuery';

import { Schema } from '../schema';
import type { PreparedQueries, TableColumnNames, TableRow } from '../types';

/** The row this write depends on: the parent side of a foreign key declared in {@link Schema}. */
type ParentRow = {
  column: string;
  table: keyof Schema;
  value: unknown;
};

/**
 * An upsert that writes nothing when the parent row it references is absent. Conflicts are checked
 * on `conflictCheckKeys`, defaulting to the primary key.
 *
 * It is separate from `createUpsertQuery` so that function stays a plain "insert or update". Only
 * part of a channel's messages is cached, so a child row (a reaction, say) can arrive for a parent
 * the database never held. SQLite rejects it, and as queries run in one batch, that aborts every
 * unrelated write alongside it. Skipping it is correct: the child returns with its parent once that
 * is cached.
 *
 * The check is a `WHERE EXISTS` inside the statement, so it costs no round trip and cannot race the
 * write. SQLite requires that `WHERE` when `INSERT ... SELECT` is followed by `ON CONFLICT`.
 *
 * @param table The table name.
 * @param row The table row to insert or update.
 * @param parent The row that must exist for anything to be written.
 * @param conflictCheckKeys The columns to check conflicts on. Defaults to the primary key.
 * @returns The prepared query as `[sql, params]`.
 */
export const createUpsertQueryIfParentExists = <T extends keyof Schema>(
  table: T,
  row: Partial<TableRow<T>>,
  parent: ParentRow,
  conflictCheckKeys?: Array<TableColumnNames<T>>,
): PreparedQueries => {
  const { columns, conflictConstraint, questionMarks, values } = upsertStatementParts(
    table,
    row,
    conflictCheckKeys,
  );

  return [
    `INSERT INTO ${table} (${columns}) SELECT ${questionMarks} WHERE EXISTS (SELECT 1 FROM ${parent.table} WHERE ${parent.column} = ?) ${conflictConstraint}`,
    [...values, parent.value],
  ];
};
