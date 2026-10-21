import { appendWhereClause } from './appendWhereCluase';

import type { Schema } from '../schema';
import type { PreparedQueries, TableColumnNames, TableColumnValue } from '../types';

/**
 * Creates a prepared `DELETE` query. In `whereCondition` an array value matches with `IN`, a key
 * with an `undefined` value is skipped, and the conditions are joined with AND.
 *
 * @param table The table name.
 * @param whereCondition Column values to match, for example `{ id: 'a', cid: ['b', 'c'] }`.
 * @returns The prepared query as `[sql, params]`.
 */

export const createDeleteQuery = <T extends keyof Schema>(
  table: T,
  whereCondition: Partial<{ [k in TableColumnNames<T>]: TableColumnValue | TableColumnValue[] }>,
): PreparedQueries => {
  const deleteQuery = `DELETE FROM ${table}`;

  return appendWhereClause(deleteQuery, whereCondition);
};
