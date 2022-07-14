import { appendWhereClause } from './appendWhereCluase';

import type { Schema } from '../schema';
import type { PreparedQueries, TableColumnNames } from '../types';

/**
 * Creates a simple delete query for sqlite.
 *
 * @param {string} table Table name
 * @param {Object} whereCondition Where condition for select query.
 *  e.g., { id: 'vishal', cid: ['messaging:id1', 'messaging:id2'] }.
 *  All the conditions will be joined with AND in final query.
 * @returns {string} Final select query
 */

export const createDeleteQuery = <T extends keyof Schema>(
  table: T,
  whereCondition: Partial<{ [k in TableColumnNames<T>]: any }>,
) => {
  const deleteQuery = `DELETE FROM ${table}`;

  return appendWhereClause(deleteQuery, whereCondition) as PreparedQueries;
};
