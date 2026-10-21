import { appendWhereClause } from './appendWhereCluase';

import type { Schema } from '../schema';
import type { PreparedQueries, TableColumnNames, TableColumnValue, TableRow } from '../types';

/**
 * Creates a prepared `UPDATE OR IGNORE` query that sets the columns in `set`. In `whereCondition`
 * an array value matches with `IN`, a key with an `undefined` value is skipped, and the conditions
 * are joined with AND.
 *
 * @param table The table name.
 * @param set The column values to write.
 * @param whereCondition Column values to match, for example `{ id: 'a', cid: ['b', 'c'] }`.
 * @returns The prepared query as `[sql, params]`.
 */
export const createUpdateQuery = <T extends keyof Schema>(
  table: T,
  set: Partial<TableRow<T>>,
  whereCondition: Partial<{ [k in TableColumnNames<T>]: TableColumnValue | TableColumnValue[] }>,
): PreparedQueries => {
  const fields = Object.keys(set).map((key) => `${key} = ?`);

  const updateQuery = `UPDATE OR IGNORE ${table} SET ${fields.join(',')}`;

  const [updateQueryWithWhere, whereParams] = appendWhereClause(updateQuery, whereCondition);

  return [`${updateQueryWithWhere}`, [...Object.values(set), ...(whereParams || [])]];
};
