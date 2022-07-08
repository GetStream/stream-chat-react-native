import { appendWhereClause } from './appendWhereCluase';

import type { Schema } from '../schema';
import type { PreparedQueries, TableColumns } from '../types';

export const createDeleteQuery = <T extends keyof Schema>(
  table: T,
  whereCondition: Partial<{ [k in TableColumns<T>]: any }>,
) => {
  const deleteQuery = `DELETE FROM ${table}`;

  const [deleteQueryWithWhere, whereParams] = appendWhereClause(deleteQuery, whereCondition);

  return [deleteQueryWithWhere, whereParams] as PreparedQueries;
};
