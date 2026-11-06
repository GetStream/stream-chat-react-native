import { appendOrderByClause } from './appendOrderByClause';
import { appendWhereClause } from './appendWhereCluase';

import type { Schema } from '../schema';
import type { PreparedQueries, TableColumnNames, TableColumnValue } from '../types';

/**
 * Creates a prepared `SELECT` query for `fields` (defaults to `['*']`). In `whereCondition` an
 * array value matches with `IN`, a key with an `undefined` value is skipped, and the conditions are
 * joined with AND.
 *
 * @param table The table name.
 * @param fields The columns to select. Defaults to `['*']`.
 * @param whereCondition Column values to match, for example `{ id: 'a', cid: ['b', 'c'] }`.
 * @param orderBy Column sort directions, `1` for ascending and `-1` for descending.
 * @returns The prepared query as `[sql, params]`.
 */
export const createSelectQuery = <T extends keyof Schema>(
  table: T,
  fields: Array<'*'> | Array<TableColumnNames<T>> = ['*'],
  whereCondition?: Partial<{ [k in TableColumnNames<T>]: TableColumnValue | TableColumnValue[] }>,
  orderBy?: Partial<{ [k in TableColumnNames<T>]: 1 | -1 }>,
): PreparedQueries => {
  const selectQuery = `SELECT ${fields.join(', ')} FROM ${table}`;
  const [selectQueryWithWhere, whereParams] = appendWhereClause(selectQuery, whereCondition);
  const [selectQueryWithOrderBy] = appendOrderByClause(selectQueryWithWhere, orderBy);

  return [`${selectQueryWithOrderBy}`, whereParams || []];
};
