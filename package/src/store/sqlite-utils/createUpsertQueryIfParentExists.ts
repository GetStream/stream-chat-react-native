import { upsertStatementParts } from './createUpsertQuery';

import { Schema } from '../schema';
import type { PreparedQueries, TableColumnNames, TableRow } from '../types';

/**
 * The row this write depends on - the parent side of a foreign key declared in {@link Schema}.
 */
type ParentRow = {
  column: string;
  table: keyof Schema;
  value: unknown;
};

/**
 * An upsert that writes nothing at all when the row it references is absent.
 *
 * Deliberately NOT an option on `createUpsertQuery`: "insert or update" is a contract worth keeping
 * exact, and this is a third thing - "insert or update, or do nothing" - so it says so in its name
 * rather than hiding behind a flag.
 *
 * For the tables whose schema declares a foreign key. Only part of a channel's messages are ever
 * cached, so a child row can genuinely arrive for a parent this database has never held - a reaction
 * on an old message, say. SQLite rejects that child, and since these queries are executed as one
 * batch, the one rejected statement aborts every unrelated write alongside it.
 *
 * Skipping is the honest outcome rather than the lesser evil: these tables mirror what is held
 * locally, so a child with no parent has nothing to hang off, and it comes back on its own once the
 * parent is cached (a message arrives carrying its own reactions).
 *
 * Expressed as `WHERE EXISTS` inside the statement rather than as a separate probe so it costs no
 * extra round trip and cannot race with the write it guards - and the lookup it does is the same
 * index lookup the foreign key already forces on every insert. SQLite requires that `WHERE` when an
 * `INSERT ... SELECT` is followed by `ON CONFLICT`, so the clause doing the guarding is also what
 * keeps the upsert unambiguous.
 *
 * @param table Table name.
 * @param row Table row to insert or update.
 * @param parent The row that must exist for anything to be written.
 * @param conflictCheckKeys Custom list of columns to check conflicts for. Defaults to primary keys.
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
