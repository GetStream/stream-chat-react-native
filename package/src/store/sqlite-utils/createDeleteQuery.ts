import { appendWhereClause } from './appendWhereCluase';

import type { Schema } from '../schema';
import type { PreparedQueries, TableColumnNames } from '../types';

export const createDeleteQuery = <T extends keyof Schema>(
  table: T,
  whereCondition: Partial<{ [k in TableColumnNames<T>]: any }>,
) => {
  const deleteQuery = `DELETE FROM ${table}`;

  return appendWhereClause(deleteQuery, whereCondition) as PreparedQueries;
};
