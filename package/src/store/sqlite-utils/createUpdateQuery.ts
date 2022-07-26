import { appendWhereClause } from './appendWhereCluase';

import type { Schema } from '../schema';
import type { PreparedQueries, TableColumnNames } from '../types';

/**
 * Creates a simple update query for sqlite.
 *
 * @param {string} table Table name
 * @param {Object} set Set conditions for update query.
 * @param {Object} whereCondition Where condition for select query.
 *  e.g., { id: 'vishal', cid: ['messaging:id1', 'messaging:id2'] }.
 *  All the conditions will be joined with AND in final query.
 * @returns {string} Final update query for sqlite
 */
export const createUpdateQuery = <T extends keyof Schema>(
  table: T,
  set: Partial<{ [k in TableColumnNames<T>]: any }>,
  whereCondition: Partial<{ [k in TableColumnNames<T>]: any }>,
): PreparedQueries => {
  const fields = Object.keys(set).map((key) => `${key} = ?`);
  const updateQuery = `UPDATE ${table} SET ${fields.join(',')}`;

  const [updateQueryWithWhere, whereParams] = appendWhereClause(updateQuery, whereCondition);

  return [updateQueryWithWhere, [...Object.values(set), ...(whereParams || [])]];
};
