import { appendWhereClause } from './appendWhereCluase';

import type { Schema } from '../schema';
import type { PreparedQueries, TableColumnNames } from '../types';

export const createUpdateQuery = <T extends keyof Schema>(
  table: T,
  set: Partial<{ [k in TableColumnNames<T>]: any }>,
  whereCondition: Partial<{ [k in TableColumnNames<T>]: any }>,
) => {
  const fields = Object.keys(set).map((key) => `${key} = ?`);
  const updateQuery = `UPDATE ${table} SET ${fields.join(',')}`;

  const [updateQueryWithWhere, whereParams] = appendWhereClause(updateQuery, whereCondition);

  return [updateQueryWithWhere, [...Object.values(set), ...whereParams]] as PreparedQueries;
};
